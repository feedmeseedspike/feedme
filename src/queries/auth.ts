import { getUser, signInUser, registerUser, signOutUser, updatePassword, SignInUserReturn, RegisterUserReturn, SignOutUserReturn, UpdatePasswordReturn, AuthSuccess, GetUserReturn } from "src/lib/actions/auth.actions";


export const getUserQuery = () => ({
  queryKey: ['user'],
  queryFn: async (): Promise<GetUserReturn> => {
    const user = await getUser();
    return user;
  },
});

export const signInMutation = () => ({
  mutationFn: async (variables: Parameters<typeof signInUser>[0]): Promise<any> => {
    const result: SignInUserReturn = await signInUser(variables);
    if (!result.success) {
      const errorMessage = typeof result.error === 'string'
        ? result.error
        : (typeof result.error === 'object' && result.error !== null && 'message' in result.error
          ? result.error.message
          : 'Sign in failed');
      throw new Error(errorMessage);
    }
    return (result as AuthSuccess<any>).data; 
  },
});

export const registerUserMutation = () => ({
  mutationFn: async (variables: Parameters<typeof registerUser>[0]): Promise<any> => {
    const result: RegisterUserReturn = await registerUser(variables);
    if (!result.success) {
      const errorMessage = typeof result.error === 'string'
        ? result.error
        : (typeof result.error === 'object' && result.error !== null && 'message' in result.error
          ? result.error.message
          : 'Registration failed');
      throw new Error(errorMessage);
    }
    return (result as AuthSuccess<any>).data; 
  },
});

export const signOutMutation = () => ({
  mutationFn: async (): Promise<SignOutUserReturn> => {
    const result: SignOutUserReturn = await signOutUser();
    if (!result.success) {
       throw new Error('Sign out failed');
    }
    // signOutUser returns { success: true }, so we can return true
    return result; // Return the full result object including success: true
  },
});

// Define a type for the update password variables
interface UpdatePasswordVariables {
  currentPassword: string;
  newPassword: string;
}

export const updatePasswordMutation = () => ({
  mutationFn: async (variables: UpdatePasswordVariables): Promise<any> => {
    const result: UpdatePasswordReturn = await updatePassword(variables.currentPassword, variables.newPassword);
    if (!result.success) {
       const errorMessage = typeof result.error === 'string'
        ? result.error
        : (typeof result.error === 'object' && result.error !== null && 'message' in result.error
          ? result.error.message
          : 'Password update failed');
      throw new Error(errorMessage);
    }
    return (result as AuthSuccess<any>).data;
  },
}); 