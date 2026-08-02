import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { UserModel, UserRaHistoryModel } from '@/models/User.js';

const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day

type SigaaSession = { sessionId: string; viewId: string };

export async function syncStudentFromSigaa(
    app: any,
    params: { ra: number; login: string },
    sigaaSession: SigaaSession,
    requestId: string
) {
    const studentEmailDomain = '@aluno.ufabc.edu.br';

    const connector = new UfabcParserConnector(requestId);
    const { sessionId, viewId } = sigaaSession;

    const { ra, login } = params;

    const currentRaNumber = ra;
    const currentRaString = String(ra);
    const studentEmail = `${login}${studentEmailDomain}`;

    const user = await UserModel.findOne({ email: studentEmail });

    if (!user) {
        return {
            status: 'not_found',
            message: `Usuário não encontrado para o e-mail ${studentEmail}`,
        } as const;
    }

    const userRaString = user.ra !== null && user.ra !== undefined ? String(user.ra) : null;

    if (userRaString !== currentRaString) {
        const userWithSameRa = await UserModel.findOne({
            ra: currentRaNumber,
            _id: { $ne: user._id },
        });

        if (userWithSameRa) {
            const RECENT_RA_CHANGE_WINDOW_DAYS = 30;

            const isRecentChange =
                userWithSameRa.updatedAt !== null &&
                userWithSameRa.updatedAt !== undefined &&
                Date.now() - userWithSameRa.updatedAt.getTime() <
                RECENT_RA_CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

            if (isRecentChange) {
                return {
                    status: 'conflict',
                    message:
                        'Este RA está associado a um usuário atualizado recentemente. A reatribuição automática foi bloqueada.',
                } as const;
            }

            await UserRaHistoryModel.create({
                userId: userWithSameRa._id,
                Ra: currentRaString,
            });

            userWithSameRa.ra = null;
            await userWithSameRa.save();
        }

        const previousRa = user.ra !== null && user.ra !== undefined ? String(user.ra) : null;

        if (previousRa !== null) {
            await UserRaHistoryModel.create({
                userId: user._id,
                Ra: previousRa,
            });
        }

        user.ra = currentRaNumber;
        await user.save();
    }

    const cacheKey = `http:students:sigaa:${ra}`;

    const cached = await app.redis.get(cacheKey);
    if (cached) {
        return { status: 'cached', cacheKey } as const;
    }

    let studentSync = await app.db.StudentSync.findOne({ ra: currentRaString });
    if (!studentSync) {
        studentSync = await app.db.StudentSync.create({
            ra: currentRaString,
            status: 'created',
            timeline: [
                {
                    status: 'created',
                    metadata: {
                        login,
                    },
                },
            ],
        });
    }

    await connector.syncStudent({
        sessionId,
        viewId,
        requesterKey: app.config.UFABC_PARSER_REQUESTER_KEY,
    });

    await studentSync.transition('awaiting', {
        source: 'sigaa',
        login,
    });
    await app.redis.set(cacheKey, login, 'PX', CACHE_TTL);

    return {
        status: 'success',
        data: { ra: currentRaString, login },
    } as const;
}

export default syncStudentFromSigaa;
