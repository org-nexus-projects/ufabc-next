import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export const helpFormSchema = z.object({
  email: z
    .string({
      required_error: 'O email é obrigatório',
    })
    .email('Digite um email válido')
    .min(1, 'O email é obrigatório'),
  ra: z
    .string({
      required_error: 'O RA é obrigatório',
    })
    .min(1, 'O RA é obrigatório')
    .regex(/^\d+$/, 'O RA deve conter apenas números'),
  problemTitle: z
    .string({
      required_error: 'O título é obrigatório',
    })
    .min(5, 'O título deve ter pelo menos 5 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  problemDescription: z
    .string({
      required_error: 'A descrição é obrigatória',
    })
    .min(20, 'A descrição deve ter pelo menos 20 caracteres')
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres'),
  image: z
    .instanceof(File)
    .optional()
    .refine((file) => {
      if (!file) return true; // Optional field
      return file.size <= MAX_FILE_SIZE;
    }, 'A imagem deve ter no máximo 5MB')
    .refine((file) => {
      if (!file) return true; // Optional field
      return ACCEPTED_IMAGE_TYPES.includes(file.type);
    }, 'Apenas imagens nos formatos JPEG, JPG ou PNG são permitidas'),
});
