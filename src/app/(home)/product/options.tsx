"use client";

import { Label } from '@components/ui/label';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { Separator } from '@components/ui/separator';
import Image from 'next/image';
import React from 'react';
import { formatNaira } from 'src/lib/utils';
import { z } from 'zod';
import clsx from 'clsx';

const Price = (field: string) =>
  z.coerce
    .number()
    .int()
    .refine(
      (value) => value > 0,
      `${field} must be a whole number greater than zero`
    );

export const OptionSchema = z.object({
  name: z.string().min(1, "Option name is required"),
  price: Price("Option price"),
  image: z.string().url("Invalid image URL"),
  stockStatus: z.string().optional(),
  stock_status: z.string().optional(),
  countInStock: z.number().optional().nullable(),
});
export type Options = z.infer<typeof OptionSchema>;

const Options = ({ 
  options, 
  selectedOption, 
  onOptionChange 
}: { 
  options: Options[];
  selectedOption?: string;
  onOptionChange: (value: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-[10px]">
        <p className="h4-bold">Select Option</p>
        <p className="text-[#B54708] text-xs font-semibold bg-[#FFFAEB] py-1 px-2 rounded-[16px] flex items-center">
          Required
        </p>
      </div>
      <RadioGroup value={selectedOption || ''} onValueChange={onOptionChange} className='h-[10rem] overflow-y-auto'>
        {options?.map((option) => {
          const isOptionOutOfStock = 
            (option.stockStatus && option.stockStatus.toLowerCase().replace(/_/g, " ") === "out of stock") ||
            (option.stock_status && option.stock_status.toLowerCase().replace(/_/g, " ") === "out of stock") ||
            (typeof option.countInStock === "number" && option.countInStock <= 0);

          return (
            <React.Fragment key={option.name}>
              <div className={clsx("flex items-center justify-between", isOptionOutOfStock && "opacity-50 cursor-not-allowed")}>
                <Label htmlFor={option.name} className={clsx("flex items-center gap-4", isOptionOutOfStock ? "cursor-not-allowed" : "cursor-pointer")}>
                  <Image
                    width={54}
                    height={54}
                    src={option.image}
                    alt={option.name}
                    className="size-[54px] rounded-[5px] border-[0.31px] border-[#81a6e2]"
                  />
                  <div className="flex flex-col gap-[4px]">
                    <p className="h4-bold">{option.name}</p>
                    <p className="flex items-center gap-2">
                      <span>{formatNaira(option.price)}</span>
                      {isOptionOutOfStock && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          Out of Stock
                        </span>
                      )}
                    </p>
                  </div>
                </Label>
                <RadioGroupItem value={option.name} id={option.name} disabled={isOptionOutOfStock} />
              </div>
              <Separator className="" />
            </React.Fragment>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default Options;