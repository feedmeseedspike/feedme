import * as React from "react"
import Location from "@components/icons/location.svg"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../ui/select"

export function Locations() {
  return (
    <Select>
      <SelectTrigger className="text-[12px] text-white flex justify-center items-center">
        <Location className="mr-1"/>
        <SelectValue placeholder="Select Location" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup> 
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
