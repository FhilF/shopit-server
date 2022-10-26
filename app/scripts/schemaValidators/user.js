const z = require("zod"),
  { isValidObjectId } = require("mongoose");
const paymentType = require("../../lib/paymentTypes");

exports.userAddressValidator = z.object({
  name: z.string().trim().min(2),
  phoneNumber: z.string().trim().min(2),
  country: z.string().trim().min(2),
  state: z.string().trim().min(2),
  city: z.string().trim().min(2),
  zipCode: z.string().trim().min(2),
  addressLine1: z.string().trim().min(2),
  addressLine2: z.string().trim().min(2).optional(),
  label: z.string().trim().min(2),
  isDefault: z.boolean(),
});

exports.userOrderValidator = z.object({
  ids: z
    .string()
    .array()
    .min(1)
    .refine((array) => array.every((id) => isValidObjectId(id)), {
      message: "Invalid product ids",
    }),
  billToAddressId: z
    .string()
    .min(1)
    .refine((id) => isValidObjectId(id), {
      message: "Invalid address id",
    }),
  shipToAddressId: z
    .string()
    .min(1)
    .refine((id) => isValidObjectId(id), {
      message: "Invalid address id",
    }),
  paymentType: z
    .string()
    .trim()
    .min(1)
    .refine((data) => paymentType.some((v) => v === data), {
      message: "Invalid payment type",
    }),
  courier: z
    .string()
    .min(1)
    .refine((id) => isValidObjectId(id), {
      message: "Invalid courier id",
    }),
});
