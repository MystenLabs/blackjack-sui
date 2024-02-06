import * as z from "zod";

export const TransferSUIFormSchema = z.object({
  recipient: z
    .string()
    .regex(new RegExp("0x.*"), "Must be a valid SUI address (0x...)"),
  //   amount: z.number().positive("SUI amount must be a positive number"),
  amount: z.preprocess(
    (str) => parseInt(z.string().parse(str), 10),
    z.number().positive("SUI amount must be a positive number")
  ),
  category: z.string().min(1, "Required"),
  description: z.string(),
});
