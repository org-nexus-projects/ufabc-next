// export async function queueProcessor(name: string) {
//   new Worker(
//     name,
//     async <TJobData>(job: Job<TJobData>) => {
//       cons user = job.data;
//       try {
//         await sendConfirmationEmail(user);

//       } catch (error) {
//          }
//     },
//     { connection },
//   );
//    console.log('Worker de envio de e-mails de confirmação está rodando...');
// }
export * from './setup';
export * from './jobs/confirmationEmail/email';
