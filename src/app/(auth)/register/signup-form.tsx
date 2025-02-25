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
import { IUserSignUp } from '../../../types/index'
// import { registerUser, signInWithCredentials } from '@/lib/actions/user.actions'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSignUpSchema } from '../../../lib/validator'
import { Separator } from '@components/ui/separator'
import { isRedirectError } from 'next/dist/client/components/redirect'
import { registerUser } from 'src/lib/actions/user.actions'
// import { isRedirectError } from 'next/dist/client/components/redirect-error'

const signUpDefaultValues =
  process.env.NODE_ENV === 'development'
    ? {
      name: 'john doe',
      email: 'john@me.com',
      password: '123456',
      confirmPassword: '123456',
    }
    : {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    }

export default function CredentialsSignUpForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const form = useForm<IUserSignUp>({
    resolver: zodResolver(UserSignUpSchema),
    defaultValues: signUpDefaultValues,
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IUserSignUp) => {
    console.log(data)
    try {
      const res = await registerUser(data)
      if (!res.success) {
        toast({
          title: 'Error',
          description: res.error,
          variant: 'destructive',
        })
        return
      }
      console.log(res)
      redirect(callbackUrl)
    } catch (error) {
      if (isRedirectError(error)) {
        throw error
      }
      toast({
        title: 'Error',
        description: 'Invalid email or password',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        <div className='space-y-6'>
          <FormField
            control={control}
            name='name'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-semibold ring-zinc-400'>Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter name address' {...field} className='py-6 ring-1 ring-zinc-400' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-semibold ring-zinc-400'>Email</FormLabel>
                <FormControl>
                  <Input placeholder='Enter email address' {...field} className='py-6 ring-1 ring-zinc-400' />
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
                    type='password'
                    placeholder='Enter password'
                    className='py-6 ring-1 ring-zinc-400'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem className='w-full'>
                <FormLabel className='font-semibold ring-zinc-400'>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Confirm Password'
                    className='py-6 ring-1 ring-zinc-400'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='w-full pt-4'>
            <Button className='w-full py-4 text-base bg-[#E0E0E0] text-zinc-600 ring-1 ring-zinc-400 font-semibold hover:bg-[#1B6013] transition-all ease-in-out hover:text-white hover:duration-500' type='submit'>Sign Up</Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
