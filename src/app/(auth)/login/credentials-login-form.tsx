'use client'
import { redirect, useSearchParams } from 'next/navigation'

import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import Link from 'next/link'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form'
import { useForm } from 'react-hook-form'
import { IUserSignIn } from '../../../types/index'

// import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignInSchema } from '../../../lib/validator'
import { isRedirectError } from 'next/dist/client/components/redirect'
import { signInUser } from 'src/lib/actions/user.actions'

const signInDefaultValues =
  process.env.NODE_ENV === 'development'
    ? {
      email: 'admin@example.com',
      password: '123456',
    }
    : {
      email: '',
      password: '',
    }

export default function CredentialsSignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const form = useForm<IUserSignIn>({
    resolver: zodResolver(UserSignInSchema),
    defaultValues: signInDefaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IUserSignIn) => {
    console.log(data)
    try {
      const user = await signInUser({
        email: data.email,
        password: data.password,
      })
      console.log(user)
      // redirect(callbackUrl)
    } catch (error) {
      if (isRedirectError(error)) {
        throw error
      }
      // toast({
      //   title: 'Error',
      //   description: 'Invalid email or password',
      //   variant: 'destructive',
      // })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
      >
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        <div className='space-y-6'>
          <FormField
            control={control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-semibold ring-zinc-400' >Email Address</FormLabel>
                <FormControl>
                  <Input className='py-6 ring-1 ring-zinc-400' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='password'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-semibold ring-zinc-400'>Password</FormLabel>
                <FormControl>
                  <Input
                    className='py-6 ring-1 ring-zinc-400'
                    type='password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='w-full pt-4'>
            <Button className='w-full py-4 text-base bg-[#E0E0E0] text-zinc-600 ring-1 ring-zinc-400 font-semibold hover:bg-[#1B6013] transition-all ease-in-out hover:text-white hover:duration-500' type='submit'>Sign In</Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
