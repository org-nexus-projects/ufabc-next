import { z } from 'zod';

export const announcementValidationSchema = z.object({
  courseId: z.number({
    required_error: 'Curso é obrigatório',
    invalid_type_error: 'Curso é obrigatório',
  }),
  text: z
    .string()
    .min(1, 'Texto do anúncio é obrigatório')
    .max(1000, 'Texto do anúncio deve ter no máximo 1000 caracteres'),
});
