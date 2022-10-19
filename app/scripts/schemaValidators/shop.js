const z = require("zod");

const shopAddressAddValidator = z.object({
  country: z.string().trim().min(2),
  state: z.string().trim().min(2),
  city: z.string().trim().min(2),
  zipCode: z.string().trim().min(2),
  addressLine1: z.string().trim().min(2),
  addressLine2: z.string().trim().min(2).optional(),
});

exports.shopAddValidator = z.object({
  name: z.string().trim().min(2).max(40),
  address: shopAddressAddValidator,
  phoneNumber: z.string().trim().min(2),
  category: z.array(z.string().min(2)),
  telephoneNumber: z.string().min(2).optional(),
});

const shopAddressUpdateAddValidator = z
  .object({
    country: z.string().trim().min(2).optional(),
    state: z.string().trim().min(2).optional(),
    city: z.string().trim().min(2).optional(),
    zipCode: z.string().trim().min(2).optional(),
    addressLine1: z.string().trim().min(2).optional(),
    addressLine2: z.string().trim().min(2).optional(),
  })
  .optional();

exports.shopUpdateValidator = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  phoneNumber: z.string().trim().min(2).optional(),
  address: shopAddressUpdateAddValidator,
  phoneNumber: z.string().trim().min(2).optional(),
  category: z.array(z.string().min(2)).optional(),
  telephoneNumber: z.string().min(2).optional(),
});
