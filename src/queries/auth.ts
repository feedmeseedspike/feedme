import axios from "axios";
import {
  getUser,
  signInUser,
  registerUser,
  signOutUser,
  updatePassword,
  SignInUserReturn,
  RegisterUserReturn,
  SignOutUserReturn,
  UpdatePasswordReturn,
  AuthSuccess,
  GetUserReturn,
} from "src/lib/actions/auth.actions";

export const getUserQuery = () => ({
  queryKey: ["user"],
  queryFn: async (): Promise<GetUserReturn> => {
    const user = await getUser();
    // Ensure the returned user is in a consistent shape or handle null
    return user;
  },
});

export const signInMutation = () => ({
  mutationFn: async (
    variables: Parameters<typeof signInUser>[0]
  ): Promise<SignInUserReturn> => {
    const result: SignInUserReturn = await signInUser(variables);
    if (!result.success) {
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : typeof result.error === "object" &&
              result.error !== null &&
              "message" in result.error
            ? result.error.message
            : "Sign in failed";
      throw new Error(errorMessage);
    }
    if (result) {
      axios.defaults.headers.common["Authorization"] =
        `Bearer ${result.data.session.access_token}`;
    }
    return result;
  },
});

export const registerUserMutation = () => ({
  mutationFn: async (
    variables: Parameters<typeof registerUser>[0]
  ): Promise<RegisterUserReturn> => {
    const result: RegisterUserReturn = await registerUser(variables);
    if (!result.success) {
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : typeof result.error === "object" &&
              result.error !== null &&
              "message" in result.error
            ? result.error.message
            : "Registration failed";
      throw new Error(errorMessage);
    }
    return result;
  },
});

export const signOutMutation = () => ({
  mutationFn: async (): Promise<SignOutUserReturn> => {
    const result: SignOutUserReturn = await signOutUser();
    if (!result.success) {
      // Although signOutUser currently always returns success: true,
      // we include this check for consistency and future-proofing.
      throw new Error("Sign out failed");
    }
    // signOutUser returns { success: true }, so we can return true
    return result; // Return the full result object including success: true
  },
  // Optionally, add onSettled to invalidate the user query after sign out
  // onSettled: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
});

// Define a type for the update password variables
interface UpdatePasswordVariables {
  currentPassword: string;
  newPassword: string;
}

export const updatePasswordMutation = () => ({
  mutationFn: async (
    variables: UpdatePasswordVariables
  ): Promise<UpdatePasswordReturn> => {
    const result: UpdatePasswordReturn = await updatePassword(
      variables.currentPassword,
      variables.newPassword
    );
    if (!result.success) {
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : typeof result.error === "object" &&
              result.error !== null &&
              "message" in result.error
            ? result.error.message
            : "Password update failed";
      throw new Error(errorMessage);
    }
    return result;
  },
});
