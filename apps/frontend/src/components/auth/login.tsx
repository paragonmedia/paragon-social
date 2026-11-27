'use client';

import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import Link from 'next/link';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useMemo, useState } from 'react';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { LoginUserDto } from '@gitroom/nestjs-libraries/dtos/auth/login.user.dto';
import { GithubProvider } from '@gitroom/frontend/components/auth/providers/github.provider';
import { OauthProvider } from '@gitroom/frontend/components/auth/providers/oauth.provider';
import { GoogleProvider } from '@gitroom/frontend/components/auth/providers/google.provider';
import { AppleProvider } from '@gitroom/frontend/components/auth/providers/apple.provider';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { FarcasterProvider } from '@gitroom/frontend/components/auth/providers/farcaster.provider';
import WalletProvider from '@gitroom/frontend/components/auth/providers/wallet.provider';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
type Inputs = {
  email: string;
  password: string;
  providerToken: '';
  provider: 'LOCAL';
};
export function Login() {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [notActivated, setNotActivated] = useState(false);
  const {
    isGeneral,
    neynarClientId,
    appleClientId,
    billingEnabled,
    genericOauth,
  } = useVariables();
  const resolver = useMemo(() => {
    return classValidatorResolver(LoginUserDto);
  }, []);
  const form = useForm<Inputs>({
    resolver,
    defaultValues: {
      providerToken: '',
      provider: 'LOCAL',
    },
  });
  const fetchData = useFetch();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    setNotActivated(false);
    const login = await fetchData('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        provider: 'LOCAL',
      }),
    });
    if (login.status === 400) {
      const errorMessage = await login.text();
      if (errorMessage === 'User is not activated') {
        setNotActivated(true);
      } else {
        form.setError('email', {
          message: errorMessage,
        });
      }
      setLoading(false);
    }
  };
  return (
    <FormProvider {...form}>
      <form className="flex-1 flex" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Paragon Social: login from the design, email first and Google below */}
        <div className="flex flex-col flex-1 gap-[18px]">
          <div>
            <h1 className="font-heading m-0 text-[34px] font-[700] -tracking-[0.68px]">
              {t('paragon_login_title', 'Welcome back')}
            </h1>
            <p className="mt-[8px] text-[15px] text-[#5d616a]">
              {t(
                'paragon_login_subtitle',
                'Sign in to plan and publish the content of your brands.'
              )}
            </p>
          </div>
          <div className="flex flex-col">
            <Input
              label="Email"
              translationKey="label_email"
              {...form.register('email')}
              type="email"
              className="!h-[48px] !rounded-[12px] !border-[#dfe1e5] !bg-white"
              placeholder={t('paragon_email_placeholder', 'you@company.com')}
            />
            <Input
              label="Password"
              translationKey="label_password"
              {...form.register('password')}
              autoComplete="off"
              type="password"
              className="!h-[48px] !rounded-[12px] !border-[#dfe1e5] !bg-white"
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end -mt-[18px] text-[13px]">
            <Link
              href="/auth/forgot"
              className="text-[#d42a3e] hover:text-[#a81f30]"
            >
              {t('paragon_forgot_link', 'Forgot your password?')}
            </Link>
          </div>
          {notActivated && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-[12px] p-4">
              <p className="text-amber-700 text-sm mb-2">
                {t(
                  'account_not_activated',
                  'Your account is not activated yet. Please check your email for the activation link.'
                )}
              </p>
              <Link
                href="/auth/activate"
                className="text-amber-700 underline hover:font-bold text-sm"
              >
                {t('resend_activation_email', 'Resend Activation Email')}
              </Link>
            </div>
          )}
          <Button
            type="submit"
            className="w-full rounded-[12px] !h-[48px] !bg-[#111214] !text-white text-[15px] font-[600]"
            loading={loading}
          >
            {t('sign_in_1', 'Sign in')}
          </Button>
          <div className="flex items-center gap-[12px] text-[12px] text-[#6b6f78]">
            <div className="flex-1 h-[1px] bg-[#e6e8eb]" />
            {t('or', 'or')}
            <div className="flex-1 h-[1px] bg-[#e6e8eb]" />
          </div>
          {isGeneral && genericOauth ? (
            <OauthProvider />
          ) : !isGeneral ? (
            <GithubProvider />
          ) : (
            <div className="gap-[8px] flex">
              <GoogleProvider />
              {!!appleClientId && <AppleProvider />}
              {!!neynarClientId && <FarcasterProvider />}
              {billingEnabled && <WalletProvider />}
            </div>
          )}
          <p className="m-0 text-[12px] text-[#6b6f78]">
            {t(
              'paragon_login_client_note',
              'Are you a Paragon client? Your account team gives you access.'
            )}
          </p>
        </div>
      </form>
    </FormProvider>
  );
}
