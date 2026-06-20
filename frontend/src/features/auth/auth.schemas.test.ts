import { describe, expect, it } from 'vitest';

import { loginFormSchema, registerFormSchema } from './auth.schemas';

describe('auth form schemas', () => {
  it('validates login email and password fields', () => {
    const result = loginFormSchema.safeParse({
      email: 'invalid',
      password: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual([
      'email',
      'password',
    ]);
  });

  it('requires strong matching registration passwords', () => {
    const result = registerFormSchema.safeParse({
      name: 'Student User',
      email: 'student@example.com',
      password: 'Password1!',
      confirmPassword: 'Password2!',
      role: 'STUDENT',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it('accepts a valid recruiter registration payload', () => {
    const result = registerFormSchema.safeParse({
      name: 'Recruiter User',
      email: 'recruiter@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      role: 'RECRUITER',
    });

    expect(result.success).toBe(true);
  });
});
