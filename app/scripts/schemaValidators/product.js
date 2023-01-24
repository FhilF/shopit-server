const z = require("zod"),
  { isValidObjectId } = require("mongoose");

exports.productNonMultiVarValidator = z
  .object({
    name: z.string().trim().min(2).max(120),
    imageSettings: z
      .array(z.boolean())
      .min(1, { message: "Must upload atleast 1 image(s)" }),
    Departments: z
      .array(z.string())
      .min(1)
      .refine((array) => array.every((v) => isValidObjectId(v)), {
        message: "Invalid product department id",
      }),
    description: z.string().trim().min(2).max(500),
    specifications: z
      .array(
        z
          .object({
            label: z.string().min(1),
            value: z.string().min(1),
          })
          .strict()
      )
      .min(1),
    isMultipleVariation: z.boolean().refine((data) => !data, {
      message: "Disable multiple variation",
    }),
    price: z
      .number({
        required_error: "Enter price",
        invalid_type_error: "Enter price",
      })
      .gt(0, { message: "Enter price" }),
    stock: z
      .number({
        required_error: "Enter stock",
        invalid_type_error: "Enter stock",
      })
      .gt(0, { message: "Enter stock" }),
  })
  .strict();

exports.productMultiVarValidator = z.object({
  name: z.string().trim().min(2).max(120),
  imageSettings: z
    .array(z.boolean())
    .min(1, { message: "Must upload atleast 1 image(s)" }),
  Departments: z
    .array(z.string())
    .min(1)
    .refine((array) => array.every((v) => isValidObjectId(v)), {
      message: "Invalid product department id",
    }),
  description: z.string().trim().min(2).max(500),
  specifications: z
    .array(
      z
        .object({
          label: z.string().min(1),
          value: z.string().min(1),
        })
        .strict()
    )
    .min(1),
  isMultipleVariation: z.boolean().refine((data) => data, {
    message: "Enable multiple variation",
  }),
  variationName: z.string().trim().min(2).max(60),
  variations: z.array(
    z.object({
      name: z.string().min(1, { message: "Enter variation name" }),
      price: z
        .number({
          required_error: "Enter price",
          invalid_type_error: "Enter price",
        })
        .gt(0, { message: "Enter price" }),
      stock: z
        .number({
          required_error: "Enter stock",
          invalid_type_error: "Enter stock",
        })
        .gt(0, { message: "Enter stock" }),
      sku: z.string().min(1, { message: "Enter SKU" }),
    })
  ),
});

exports.productNonMultiVarUpdateValidator = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    resetImages: z.boolean().optional(),
    oldImagesSettings: z
      .array(
        z
          .object({
            _id: z.string().refine((id) => isValidObjectId(id), {
              message: "Invalid product department id",
            }),
            isThumbnail: z.boolean(),
          })
          .strict()
      )
      .optional(),
    newImagesSettings: z.array(z.boolean()).optional(),
    Departments: z
      .array(z.string())
      .min(1)
      .refine((array) => array.every((v) => isValidObjectId(v)), {
        message: "Invalid product department id",
      })
      .optional(),
    description: z.string().trim().min(2).max(500).optional(),
    specifications: z
      .array(
        z
          .object({
            label: z.string().min(1),
            value: z.string().min(1),
          })
          .strict()
      )
      .optional(),
    isMultipleVariation: z.boolean().refine((data) => !data, {
      message: "Disable multiple variation",
    }),
    price: z
      .number({
        required_error: "Enter price",
        invalid_type_error: "Enter price",
      })
      .gt(0, { message: "Enter price" })
      .optional(),
    stock: z
      .number({
        required_error: "Enter stock",
        invalid_type_error: "Enter stock",
      })
      .gt(0, { message: "Enter stock" })
      .optional(),
  })
  .strict();

exports.productMultiVarUpdateValidator = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  resetImages: z.boolean().optional(),
  oldImagesSettings: z
    .array(
      z
        .object({
          _id: z.string().refine((id) => isValidObjectId(id), {
            message: "Invalid product department id",
          }),
          isThumbnail: z.boolean(),
        })
        .strict()
    )
    .optional(),
  newImagesSettings: z.array(z.boolean()).optional(),
  Departments: z
    .array(z.string())
    .min(1)
    .refine((array) => array.every((v) => isValidObjectId(v)), {
      message: "Invalid product department id",
    })
    .optional(),
  description: z.string().trim().min(2).max(500).optional(),
  specifications: z
    .array(
      z
        .object({
          label: z.string().min(1),
          value: z.string().min(1),
        })
        .strict()
    )
    .optional(),
  isMultipleVariation: z.boolean().refine((data) => data, {
    message: "Enable multiple variation",
  }),
  variationName: z.string().trim().min(2).max(60).optional(),
  variations: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Enter variation name" }),
        price: z
          .number({
            required_error: "Enter price",
            invalid_type_error: "Enter price",
          })
          .gt(0, { message: "Enter price" }),
        stock: z
          .number({
            required_error: "Enter stock",
            invalid_type_error: "Enter stock",
          })
          .gt(0, { message: "Enter stock" }),
        sku: z.string().min(1, { message: "Enter SKU" }),
      })
    )
    .optional(),
  oldVariations: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Enter variation name" }),
        price: z
          .number({
            required_error: "Enter price",
            invalid_type_error: "Enter price",
          })
          .gt(0, { message: "Enter price" }),
        stock: z
          .number({
            required_error: "Enter stock",
            invalid_type_error: "Enter stock",
          })
          .gt(0, { message: "Enter stock" }),
        sku: z.string().min(1, { message: "Enter SKU" }),
      })
    )
    .optional(),
  newVariations: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Enter variation name" }),
        price: z
          .number({
            required_error: "Enter price",
            invalid_type_error: "Enter price",
          })
          .gt(0, { message: "Enter price" }),
        stock: z
          .number({
            required_error: "Enter stock",
            invalid_type_error: "Enter stock",
          })
          .gt(0, { message: "Enter stock" }),
        sku: z.string().min(1, { message: "Enter SKU" }),
      })
    )
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
