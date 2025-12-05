export const firstLastNameRegex = /^[A-Za-z]{2,}$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export interface UserCreationValues {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface LoginValues {
    email: string;
    password: string;
}

export type LoginErrors = Partial<Record<keyof LoginValues | 'form', string>>;

export type UserCreationErrors = Partial<Record<keyof UserCreationValues | 'form', string>>;

export function validateUserCreate(values: UserCreationValues): UserCreationErrors {
    const errors: UserCreationErrors = {};

    const firstName = values.firstName.trim();
    const lastName = values.lastName.trim();
    const email = values.email.trim();
    const { password, confirmPassword } = values;

    if(!firstName){
        errors.firstName = 'First name is required';
    }else if (!firstLastNameRegex.test(firstName)) {
        errors.firstName = "First Name must be 2-3 letters, no spaces or numbers.";
    }

    if(!lastName){
        errors.lastName = 'First name is required';
    }else if (!firstLastNameRegex.test(lastName)) {
        errors.lastName = "First Name must be 2-3 letters, no spaces or numbers.";
    }

    if(!email){
        errors.email = 'Email is required';
    }else if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address.';
    }
    
    if(!password){
        errors.password = 'Password is required';
    }else if (!passwordRegex.test(password)) {
        errors.password =  'Password must be >8 chars, include at least 1 number and 1 special character.';
    }

    if(!confirmPassword){
        errors.password = 'Email is required';
    }else if (confirmPassword !== password) {
        errors.confirmPassword = 'Confirm Password must match Password.';
    }

    return errors;
}

export function isUserCreateValid(values: UserCreationValues): boolean{
    const errors = validateUserCreate(values);
    return Object.keys(errors).length === 0;
}

export function validateLogin(values: LoginValues): LoginErrors {
    const errors: LoginErrors = {};
    const email = values.email.trim();
    const { password } = values;

    if(!email){
        errors.email = 'Email is required';
    }else if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address.';
    }

    if(!password){
        errors.password = 'Password is required';
    }

    return errors;
}

export function isLoginValid(values: LoginValues): boolean {
  const errors = validateLogin(values);
  return Object.keys(errors).length === 0;
}