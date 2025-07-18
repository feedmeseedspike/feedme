"use client";

import { Label } from '@components/ui/label';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { Separator } from '@components/ui/separator';
import Image from 'next/image';
import React from 'react';
import { formatNaira } from 'src/lib/utils';
import { z } from 'zod';

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
});
export type Options = z.infer<typeof OptionSchema>

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
        {options?.map((option) => (
          <>
          <div key={option.name} className="flex items-center justify-between">
            <Label htmlFor={option.name} className="flex items-center gap-4">
              <Image
                width={54}
                height={54}
                src={option.image}
                alt={option.name}
                className="size-[54px] rounded-[5px] border-[0.31px] border-[#81a6e2]"
              />
              <div className="flex flex-col gap-[4px]">
                <p className="h4-bold">{option.name}</p>
                <p>{formatNaira(option.price)}</p>
              </div>
            </Label>
            <RadioGroupItem value={option.name} id={option.name} />
          </div>
            <Separator className="" />
          </>
        ))}
      </RadioGroup>
    </div>
  );
};

export default Options;