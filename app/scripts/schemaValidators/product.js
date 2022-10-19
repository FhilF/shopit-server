const z = require("zod"),
  { isValidObjectId } = require("mongoose");

exports.productValidator = z.object({
  name: z.string().trim().min(2).max(60),
  stock: z.number(),
  price: z.number(),
  description: z.string().trim().min(2).max(250),
  brand: z.string().trim().min(2).max(30),
  searchTerms: z.string().array().min(1),
  departments: z
    .string()
    .array()
    .min(1)
    .refine((array) => array.every((id) => isValidObjectId(id)), {
      message: "Invalid product department",
    }),
});

exports.productUpdateValidator = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  stock: z.number().optional(),
  price: z.number().optional(),
  description: z.string().trim().min(2).max(250).optional(),
  brand: z.string().trim().min(2).max(30).optional(),
  searchTerms: z.string().array().min(1).optional(),
  departments: z
    .string()
    .array()
    .min(1)
    .refine((array) => array.every((id) => isValidObjectId(id)), {
      message: "Invalid product department",
    })
    .optional(),
});

exports.reviewValidator = z.object({
  review: z.string().trim().min(2).max(120),
  rate: z.number().min(1).max(5),
});

exports.reviewUpdateValidator = z.object({
  review: z.string().trim().min(2).max(120).optional(),
  rate: z.number().min(1).max(5).optional(),
});
