const z = require("zod");

exports.userAddressValidator = z.object({
  fullname: z.string().trim().min(2),
  phoneNumber: z.string().trim().min(2),
  country: z.string().trim().min(2),
  state: z.string().trim().min(2),
  city: z.string().trim().min(2),
  zipCode: z.string().trim().min(2),
  addressLine1: z.string().trim().min(2),
  addressLine2: z.string().trim().min(2).optional(),
  label: z.string().trim().min(2),
  isDefault: z.boolean()
});
