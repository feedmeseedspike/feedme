import AddToCart from '@components/shared/product/add-to-cart'
import { Trash2 } from 'lucide-react'
import React from 'react'

const FavouriteActions = () => {
  return (
    <div className="flex gap-2 w-fit">
      <button className="">
        <Trash2 className="text-red-600 size-[1.2rem] md:size-[1.4rem]"/>
      </button>
      <div className="w-fit">
        <AddToCart minimal={true} />
      </div>
      {/* <button className="">
      </button> */}

    </div>
  )
}

export default FavouriteActions