'use client'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger
} from '../ui/drawer'
import useDeviceType from '../../hooks/use-device-type'
import { Button } from '../ui/button'
import { X } from 'lucide-react'

export default function CollapsibleOnMobile({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const deviceType = useDeviceType()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (deviceType === 'mobile') setOpen(false)
  }, [deviceType, searchParams])

  if (deviceType === 'unknown') return null

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {deviceType === 'mobile' && (
          <Button
            variant="outline"
            className="w-fit flex justify-end items-end px-4"
          >
            {title}
          </Button>
        )}
      </DrawerTrigger>
<DrawerContent>
  <div className="sticky top-0 z-50 flex justify-end pb-2 border-b bg-white  px-3">
    <DrawerClose asChild>
      <button aria-label="Close drawer">
        <X className="w-5 h-5" />
      </button>
    </DrawerClose>
  </div>

  <div className="">
    {children}
  </div>
</DrawerContent>

    </Drawer>
  )
}
