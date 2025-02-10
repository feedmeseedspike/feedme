'use client'

import Container from '@components/shared/Container'
import { Button } from '@components/ui/button'
import { Card } from '@components/ui/card'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import Image from 'next/image'
// import { OrderItem } from '@/lib/validator'
import { useDispatch } from 'react-redux'
// import { removeItem, updateItem } from '@/store/features/cartSlice'
// import { formatNaira } from '@/lib/utils'
import { AiOutlineMinus, AiOutlinePlus } from 'react-icons/ai'
import { formatNaira } from 'src/lib/utils'
import { OrderItem } from 'src/types'
import { removeItem, updateItem } from 'src/store/features/cartSlice'

const CartPage = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const cart = useSelector((state: any) => state.cart)
  const { items, itemsPrice, shippingPrice, totalPrice } = cart

  console.log(itemsPrice) 
  
  const handleQuantityChange = (item: OrderItem, increment: boolean) => {
    const newQuantity = increment ? item.quantity + 1 : item.quantity - 1
    if (newQuantity > 0 ) {
      dispatch(updateItem({ item, quantity: newQuantity }))
    }
  }

  const handleRemoveItem = (item: OrderItem) => {
    dispatch(removeItem(item))
  }


  return (
<main className="py-8">
  <Container>
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-grow">
        <h1 className="h2-bold mb-6">Shopping Cart</h1>
        
        <div className="space-y-4">
          {items.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-8">
                <h2 className="h3-bold mb-4">Your cart is empty</h2>
                <Button 
                  onClick={() => router.push('/')}
                  className="rounded-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </Card>
          ) : (  
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {items.map((item: OrderItem) => {
                console.log(item.price, item.quantity)
                return (
                  <div key={item.product} className="border border-[#E5E7EB] rounded-2xl flex flex-col gap-2 p-4">
                    <div className="w-full h-auto relative">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={344}
                        height={210}
                        className="object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.quantity > 1 && (
                          <p className="">{item.quantity} x {formatNaira(item.price)}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                      {item.options && (
                        <p className="text-sm">Option: {item.options[0].name}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center gap-3 border rounded-full p-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item, false)}
                          >
                            <AiOutlineMinus />
                          </Button>
                          <span>{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item, true)}
                          >
                            <AiOutlinePlus />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => handleRemoveItem(item)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatNaira(item.price * item.quantity)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Conditionally render the Order Summary only if the cart is not empty */}
      {items.length > 0 && (
        <div className="w-full lg:w-[380px]">
          <Card className="p-6">
            <h2 className="h3-bold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {items.reduce((acc: any, item: any) => acc + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{formatNaira(shippingPrice || 0)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatNaira(itemsPrice)}</span>
              </div>
            </div>
            <Button 
              className="w-full mt-6 rounded-full"
              disabled={items.length === 0}
              onClick={() => router.push('/checkout')}
            >
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      )}
    </div>
  </Container>
</main>

  )
}

export default CartPage
