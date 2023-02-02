const z = require("zod"),
  { isValidObjectId } = require("mongoose");

exports.userAddressValidator = z.object({
  name: z.string().trim().min(2),
  phoneNumber: z
    .object({ number: z.number(), countryCode: z.number() })
    .strict(),
  country: z.string().trim().min(1),
  region: z.string().trim().min(1),
  province: z.string().trim().min(2),
  city: z.string().trim().min(2),
  barangay: z.string().trim().min(2),
  zipCode: z.number(),
  addressLine1: z.string().trim().min(2),
  addressLine2: z.string().trim().min(2).optional(),
  label: z.string().trim().min(2),
  isDefault: z.boolean(),
});

exports.userOrderValidator = z.object({
  address: z
    .string()
    .min(1)
    .refine((id) => isValidObjectId(id), {
      message: "Invalid address id",
    }),
  paymentMethod: z
    .string()
    .min(1)
    .refine((id) => isValidObjectId(id), {
      message: "Invalid payment method id",
    }),
});

exports.accountUpdateValidator = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  phoneNumber: z
    .object({ number: z.number(), countryCode: z.number() })
    .strict()
    .optional(),
});
