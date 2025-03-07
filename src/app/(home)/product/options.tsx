"use client"

import { Label } from '@components/ui/label'
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group'
import Image from 'next/image'
import React from 'react'
import { formatNaira } from 'src/lib/utils'
import { Options } from 'src/types'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { setSelectedOption } from 'src/store/features/optionsSlice'

const Options = ({ options }: { options: Options[] }) => {
  const dispatch = useDispatch()
  const selectedOption = useSelector((state: RootState) => state.options.selectedOption)

  const handleSelect = (value: string) => {
    dispatch(setSelectedOption(value))
    console.log('Selected option:', value)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-[10px]">
        <p className="h4-bold">Select Option</p>
        <p className="text-[#B54708] text-xs font-semibold bg-[#FFFAEB] py-1 px-2 rounded-[16px] flex items-center">
          Required
        </p>
      </div>
      <RadioGroup onValueChange={handleSelect}>
        {options?.map((option) => (
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
        ))}
      </RadioGroup>
      {selectedOption && <p>Selected: {selectedOption}</p>}
    </div>
  )
}

export default Options
