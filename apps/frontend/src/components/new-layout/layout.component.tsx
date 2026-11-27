'use client';

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';
import {
  ParagonSidebarChannels,
  ParagonSpaceSelector,
} from '@gitroom/frontend/components/new-layout/paragon.sidebar';
import { jakartaSans } from '@gitroom/frontend/fonts/plus-jakarta-sans/plus.jakarta.sans.font';
const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  {
    ssr: false,
  }
);

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { usePathname, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { CheckPayment } from '@gitroom/frontend/components/layout/check.payment';
import { ToolTip } from '@gitroom/frontend/components/layout/top.tip';
import { ShowMediaBoxModal } from '@gitroom/frontend/components/media/media.component';
import { ShowLinkedinCompany } from '@gitroom/frontend/components/launches/helpers/linkedin.component';
import { MediaSettingsLayout } from '@gitroom/frontend/components/launches/helpers/media.settings.component';
import { Toaster } from '@gitroom/react/toaster/toaster';
import { ShowPostSelector } from '@gitroom/frontend/components/post-url-selector/post.url.selector';
import { NewSubscription } from '@gitroom/frontend/components/layout/new.subscription';
import { Support } from '@gitroom/frontend/components/layout/support';
import { ContinueProvider } from '@gitroom/frontend/components/layout/continue.provider';
import { ContextWrapper } from '@gitroom/frontend/components/layout/user.context';
import { CopilotKit } from '@copilotkit/react-core';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Impersonate } from '@gitroom/frontend/components/layout/impersonate';
import { AnnouncementBanner } from '@gitroom/frontend/components/layout/announcement.banner';
import { Title } from '@gitroom/frontend/components/layout/title';
import { TopMenu } from '@gitroom/frontend/components/layout/top.menu';
import { LanguageComponent } from '@gitroom/frontend/components/layout/language.component';
import { ChromeExtensionComponent } from '@gitroom/frontend/components/layout/chrome.extension.component';
import NotificationComponent from '@gitroom/frontend/components/notifications/notification.component';
import { OrganizationSelector } from '@gitroom/frontend/components/layout/organization.selector';
import { InvoicesComponent } from '@gitroom/frontend/components/layout/invoices.component';
import { StreakComponent } from '@gitroom/frontend/components/layout/streak.component';
import { PreConditionComponent } from '@gitroom/frontend/components/layout/pre-condition.component';
import { AttachToFeedbackIcon } from '@gitroom/frontend/components/new-layout/sentry.feedback.component';
import { FirstBillingComponent } from '@gitroom/frontend/components/billing/first.billing.component';
import { TrialTracker } from '@gitroom/frontend/components/layout/gtm.component';
import { setSentryUser } from '@gitroom/react/sentry/initialize.sentry.client';
import { setUserTimezone } from '@gitroom/frontend/components/layout/set.timezone';

export const LayoutComponent = ({ children }: { children: ReactNode }) => {
  const fetch = useFetch();

  const { backendUrl, billingEnabled, isGeneral } = useVariables();

  // Feedback icon component attaches Sentry feedback to a top-bar icon when DSN is present
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // Paragon Social: screens already rebuilt from the design draw their own header
  const isDesignedPage =
    pathname.indexOf('/launches') === 0 || pathname.indexOf('/analytics') === 0;
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  const load = useCallback(async (path: string) => {
    return await (await fetch(path)).json();
  }, []);
  const { data: user, mutate } = useSWR('/user/self', load, {
    // set before anything renders a date in the user's timezone
    onSuccess: (data) => setUserTimezone(data?.timezoneName),
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
  });

  useEffect(() => {
    setSentryUser(
      user ? { id: user.id, email: user.email, orgId: user.orgId } : null
    );
  }, [user]);

  if (!user) return null;

  return (
    <ContextWrapper user={user}>
      <CopilotKit
        credentials="include"
        runtimeUrl={backendUrl + '/copilot/chat'}
        useSingleEndpoint={true}
        showDevConsole={false}
      >
        <MantineWrapper>
          <ToolTip />
          <Toaster />
          <TrialTracker />
          <CheckPayment check={searchParams.get('check') || ''} mutate={mutate}>
            <ShowMediaBoxModal />
            <ShowLinkedinCompany />
            <MediaSettingsLayout />
            <ShowPostSelector />
            <PreConditionComponent />
            <NewSubscription />
            <ContinueProvider />
            <div
              className={clsx(
                'flex flex-col min-h-screen min-w-screen text-newTextColor bg-[#f6f7f8] mobile:pb-[80px]',
                jakartaSans.className
              )}
            >
              <div>{user?.admin ? <Impersonate /> : <div />}</div>
              {user.tier === 'FREE' && isGeneral && billingEnabled ? (
                <FirstBillingComponent />
              ) : (
                <>
                  <AnnouncementBanner />
                  <div className="flex-1 flex">
                    <Support />
                    {menuOpen && (
                      <div
                        className="hidden mobile:block fixed inset-0 bg-newBackdrop opacity-60 z-[490]"
                        onClick={() => setMenuOpen(false)}
                      />
                    )}
                    {/* Paragon Social: dark sidebar with labels, as in the design */}
                    <div
                      className={clsx(
                        'flex flex-col bg-[#111214] text-white w-[248px] min-w-[248px] mobile:fixed mobile:top-0 mobile:bottom-0 mobile:start-0 mobile:z-[491] mobile:rounded-none mobile:overflow-y-auto mobile:overflow-x-hidden',
                        !menuOpen && 'mobile:hidden'
                      )}
                      onClick={() => setMenuOpen(false)}
                    >
                      <div
                        id="left-menu"
                        className={clsx(
                          'sticky top-0 h-screen overflow-y-auto flex flex-col gap-[28px] px-[16px] py-[24px] mobile:static mobile:h-auto mobile:min-h-full',
                          user?.admin && 'pt-[52px]'
                        )}
                      >
                        <div className="px-[8px] text-white">
                          <LogoTextComponent />
                        </div>
                        <ParagonSpaceSelector />
                        <nav className="flex flex-col gap-[2px]">
                          <TopMenu />
                        </nav>
                        <ParagonSidebarChannels />
                        <div className="flex-1" />
                        <div className="flex items-center gap-[10px] px-[8px] pt-[12px] border-t border-[#23262b]">
                          <span className="w-[32px] h-[32px] min-w-[32px] rounded-full bg-[#f93b4f] flex items-center justify-center text-[13px] font-[600] uppercase">
                            {(user?.name || user?.email || '?')
                              .split(/[\s@.]+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((w: string) => w[0])
                              .join('')}
                          </span>
                          <div className="flex flex-col flex-1 min-w-0 text-[13px]">
                            <span className="truncate">
                              {user?.name || user?.email}
                            </span>
                            <span className="text-[12px] text-[#9a9ea6] capitalize">
                              {(user?.role || '').toLowerCase()}
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-[16px] px-[8px] text-[#9a9ea6] [&_svg]:max-w-[20px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <OrganizationSelector />
                          <LanguageComponent />
                          <div className="hover:text-white">
                            <ModeComponent />
                          </div>
                          <NotificationComponent />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col blurMe">
                      {/* phones keep a slim bar to open the menu */}
                      <div className="hidden mobile:flex items-center gap-[12px] h-[56px] px-[16px] bg-white border-b border-[#eceef1]">
                        <button
                          className="flex items-center justify-center w-[36px] h-[36px] -ms-[6px] rounded-[8px] text-[#5d616a]"
                          onClick={() => setMenuOpen(true)}
                          aria-label="Open menu"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M3 6H21M3 12H21M3 18H21"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        <div className="font-heading text-[18px] font-[600] flex-1 min-w-0">
                          <Title />
                        </div>
                        <NotificationComponent />
                      </div>
                      {!isDesignedPage && (
                        <div className="px-[32px] pt-[28px] mobile:hidden font-heading text-[30px] font-[700] -tracking-[0.6px]">
                          <Title />
                        </div>
                      )}
                      <div
                        className={clsx(
                          'flex flex-1 min-w-0 mobile:flex-col',
                          !isDesignedPage &&
                            'px-[32px] py-[24px] gap-[16px] mobile:p-[12px] [&>*]:rounded-[16px]'
                        )}
                      >
                        {children}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CheckPayment>
        </MantineWrapper>
      </CopilotKit>
    </ContextWrapper>
  );
};
