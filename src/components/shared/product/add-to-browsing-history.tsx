'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { addItem } from 'src/store/features/browsingHistorySlice'

export default function AddToBrowsingHistory({
  id,
  category,
}: {
  id: string
  category: string
}) {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(addItem({ id, category }))
  }, [dispatch, id, category])

  // console.log(addItem({ id, category }))

  return null
}
