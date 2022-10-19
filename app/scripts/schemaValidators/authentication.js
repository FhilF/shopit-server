const z = require("zod");

exports.loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(6).max(20),
});

exports.registerSchema = z.object({
  name: z.string().trim().min(2).max(40),
  username: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().trim().email(),
  password: z.string().trim().min(6).max(20),
});


