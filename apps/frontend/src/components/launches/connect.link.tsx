'use client';

import { FC, ReactNode, useCallback, useState } from 'react';
import useSWR from 'swr';
import { HttpStatusCode } from 'axios';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { PlatformIcon } from '@gitroom/frontend/components/ui/platform.icon.component';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';

interface ConnectLinkDetails {
  identifier: string;
  name: string;
  redirectTo?: string;
}

const useConnectLink = (token: string) => {
  const fetch = useFetch();
  const load = useCallback(async (): Promise<ConnectLinkDetails> => {
    const response = await fetch(`/integrations/public/connect/${token}`);
    if (!response.ok) {
      throw new Error('Connection link not found');
    }
    return response.json();
  }, [token]);
  return useSWR(`connect-link-${token}`, load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
  });
};

// Paragon Social: light page of the "Link de conexión" design
const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-[28px] bg-[#f6f7f8] text-[#111214] px-[24px] py-[40px]">
    <div className="text-[#111214] [&>svg]:h-[24px] [&>svg]:w-auto">
      <LogoTextComponent />
    </div>
    {children}
  </div>
);

const Row: FC<{ icon: ReactNode; children: ReactNode }> = ({
  icon,
  children,
}) => (
  <div className="flex gap-[12px] items-start">
    <svg
      className="w-[18px] h-[18px] shrink-0 mt-[1px] text-[#1d7a46]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon}
    </svg>
    <div className="flex-1">{children}</div>
  </div>
);

export const ConnectLink: FC<{ token: string }> = ({ token }) => {
  const t = useT();
  const fetch = useFetch();
  const { data, error, isLoading, mutate } = useConnectLink(token);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failedMessage, setFailedMessage] = useState('');

  const connect = useCallback(async () => {
    setSubmitting(true);
    setFailed(false);
    setFailedMessage('');
    try {
      const response = await fetch(`/integrations/public/connect/${token}`, {
        method: 'POST',
      });
      const { url, message } = await response.json();
      if (!response.ok || !url) {
        // a refused connection says why (e.g. the plan has no channels left)
        if (response.status === HttpStatusCode.BadRequest) {
          setFailedMessage(message);
        }
        throw new Error('Could not connect to the platform');
      }
      window.location.href = url;
    } catch {
      setFailed(true);
      setSubmitting(false);
      // an expired link shows the expired screen instead
      mutate();
    }
  }, [token]);

  if (isLoading) {
    return (
      <Wrapper>
        <div className="relative z-10 flex justify-center">
          <div className="w-[40px] h-[40px] border-[3px] border-[#f93b4f] border-t-transparent rounded-full animate-spin" />
        </div>
      </Wrapper>
    );
  }

  if (error || !data) {
    return (
      <Wrapper>
        <div className="w-full max-w-[520px] bg-white border border-[#eceef1] rounded-[24px] p-[32px] text-center">
          <div className="w-[56px] h-[56px] mx-auto mb-[20px] rounded-full bg-[#fdecee] flex items-center justify-center">
            <svg
              className="w-[24px] h-[24px] text-[#d42a3e]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="font-heading text-[24px] font-[700] mb-[10px]">
            {t('connect_link_expired', 'This link is no longer valid')}
          </div>
          <div className="text-[15px] text-[#5d616a] leading-[1.55]">
            {t(
              'connect_link_expired_description',
              'Connection links work for one hour. Ask whoever sent it to you for a new one.'
            )}
          </div>
        </div>
      </Wrapper>
    );
  }

  // i18next escapes interpolated values for HTML, React already does
  const values = {
    platform: data.name,
    site: data.redirectTo,
    interpolation: { escapeValue: false },
  };

  return (
    <Wrapper>
      <section className="w-full max-w-[520px] bg-white border border-[#eceef1] rounded-[24px] p-[32px] mobile:p-[24px] flex flex-col gap-[20px]">
        <div className="flex items-center gap-[12px]">
          <span className="w-[48px] h-[48px] rounded-[14px] bg-[#f6f7f8] border border-[#eceef1] flex items-center justify-center">
            <PlatformIcon
              identifier={data.identifier}
              size={30}
              iconClassName="w-[30px] h-[30px] rounded-[8px]"
              channel=""
            />
          </span>
          <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden="true">
            <path d="M0 6h26M21 1l5 5-5 5" fill="none" stroke="#c6c9cf" strokeWidth="2" />
          </svg>
          <span className="w-[48px] h-[48px] rounded-[14px] bg-[#111214] flex items-center justify-center">
            <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
              <path d="M11 0 22 9l-4.5 4.5L11 7l-6.5 6.5L0 9z" fill="#f93b4f" />
            </svg>
          </span>
        </div>
        <div>
          <h1 className="m-0 font-heading text-[28px] mobile:text-[24px] font-[700] -tracking-[0.5px] leading-[1.15]">
            {t(
              'paragon_connect_link_heading',
              'Connect your {{platform}} with Paragon',
              values
            )}
          </h1>
          <p className="mt-[10px] mb-0 text-[15px] text-[#5d616a] leading-[1.55]">
            {t(
              'paragon_connect_link_intro',
              'Paragon Media asked you for access to schedule and publish the content you approve. You do not share your password: you sign in directly on {{platform}}.',
              values
            )}
          </p>
        </div>
        <ul className="m-0 p-0 list-none flex flex-col gap-[10px] text-[14px] text-[#3d4148]">
          <li>
            <Row icon={<path d="M20 6 9 17l-5-5" />}>
              {t(
                'paragon_connect_link_point_1',
                'Only scheduling and publishing posts, and reading their results'
              )}
            </Row>
          </li>
          <li>
            <Row icon={<path d="M20 6 9 17l-5-5" />}>
              {t(
                'paragon_connect_link_point_2',
                'Your messages and your password stay private'
              )}
            </Row>
          </li>
          <li>
            <Row icon={<path d="M20 6 9 17l-5-5" />}>
              {t(
                'paragon_connect_link_point_3',
                'Only continue if you trust whoever sent you this link'
              )}
            </Row>
          </li>
          {!!data.redirectTo && (
            <li>
              <Row icon={<path d="M20 6 9 17l-5-5" />}>
                {t(
                  'connect_link_redirect',
                  'When you are done you will be sent to {{site}}, a website outside of Paragon Social',
                  values
                )}
              </Row>
            </li>
          )}
        </ul>
        <button
          onClick={connect}
          disabled={submitting}
          className="h-[50px] rounded-[12px] bg-[#111214] hover:bg-[#2a2c31] disabled:opacity-50 text-white text-[15px] font-[600] transition-colors"
        >
          {submitting
            ? t('connect_link_connecting', 'Connecting...')
            : t('connect_link_continue', 'Continue to {{platform}}', values)}
        </button>
        {failed && (
          <div className="text-[14px] text-[#d42a3e] text-center">
            {failedMessage ||
              t(
                'could_not_connect_to_platform',
                'Could not connect to the platform'
              )}
          </div>
        )}
        <p className="m-0 text-[12.5px] text-[#6b6f78] leading-[1.5]">
          {t(
            'paragon_connect_link_revoke',
            'You can remove the access whenever you want from your {{platform}} settings. More information in our',
            values
          )}{' '}
          <a
            href="https://weareparagonmedia.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-[#d42a3e] hover:underline"
          >
            {t('paragon_privacy_policy', 'privacy policy')}
          </a>
          .
        </p>
      </section>
    </Wrapper>
  );
};
