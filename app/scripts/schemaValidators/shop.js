const z = require("zod");

const shopAddressAddValidator = z.object({
  region: z.string().trim().min(1),
  province: z.string().trim().min(1),
  city: z.string().trim().min(1),
  barangay: z.string().trim().min(1),
  zipCode: z.string().trim().min(1),
  addressLine1: z.string().trim().min(2),
  addressLine2: z.string().trim().min(2).optional(),
});

exports.shopAddValidator = z.object({
  name: z.string().trim().min(2).max(40),
  description: z.string().optional(),
  shopRepresentative: z.string().trim().min(2),
  phoneNumber: z
    .object({ number: z.number(), countryCode: z.number() })
    .strict(),
  address: shopAddressAddValidator,
  telephoneNumber: z.string().min(2).optional(),
});

const shopAddressUpdateAddValidator = z
  .object({
    region: z.string().trim().min(1),
    province: z.string().trim().min(1),
    city: z.string().trim().min(1),
    barangay: z.string().trim().min(1),
    zipCode: z.string().trim().min(1),
    addressLine1: z.string().trim().min(2),
    addressLine2: z.string().trim().min(2).optional(),
  })
  .optional();

exports.shopUpdateValidator = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  address: shopAddressUpdateAddValidator,
  phoneNumber: z
    .object({ number: z.number(), countryCode: z.number() })
    .optional(),
  telephoneNumber: z.string().min(2).optional(),
});
