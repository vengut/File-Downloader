import { z } from "zod";

export const SelectItemSchema = z.object({
  label:  z.string(),
  value:  z.string(),
  isSelected:  z.boolean().optional()
});

export type SelectItem = z.infer<typeof SelectItemSchema>;

export const SelectItemListSchema = z.array(SelectItemSchema).min(1);

export type SelectItemList = z.infer<typeof SelectItemListSchema>;