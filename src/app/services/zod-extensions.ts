import { ValidationErrors, ValidatorFn, AbstractControl } from "@angular/forms";
import { z, SafeParseReturnType } from "zod";

export const parseFactory = <T extends z.ZodTypeAny>(schema: T) => (data: unknown): SafeParseReturnType<z.infer<T>, z.infer<T>> => {
    return schema.safeParse(data);
};

export type JsonParseErrors = ValidationErrors & {
    invalidJson?: string;
    invalidType?: string;
};

export function JsonTypeValidator<T extends z.ZodTypeAny>(schema: T): ValidatorFn {
    return (control: AbstractControl): JsonParseErrors | null => {
      try {
        const obj = JSON.parse(control.value);
        const parsedResult = schema.safeParse(obj);
        return parsedResult.success ? null : { invalidType:  parsedResult.error.toString() };
      }
      catch (e) {
        return {
            invalidJson: "Invalid JSON"
        };
      }
    };
}