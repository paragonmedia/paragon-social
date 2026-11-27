import { internalFetch } from '@gitroom/helpers/utils/internal.fetch';
import { sanitizePostContent } from '@gitroom/helpers/utils/sanitize.post.content';
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
import { PlatformIcon } from '@gitroom/frontend/components/ui/platform.icon.component';
import Link from 'next/link';
import { CommentsComponents } from '@gitroom/frontend/components/preview/comments.components';
import { PreviewCommentsProvider } from '@gitroom/frontend/components/preview/preview.comments.context';
import { PostContentClient } from '@gitroom/frontend/components/preview/post.content.client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { VideoOrImage } from '@gitroom/react/helpers/video.or.image';
import { CopyClient } from '@gitroom/frontend/components/preview/copy.client';
import { getT } from '@gitroom/react/translation/get.translation.service.backend';
import { RenderPreviewDateClient } from '@gitroom/frontend/components/preview/render.preview.date.client';
import { CreationMethodBadge } from '@gitroom/frontend/components/launches/creation.method.badge';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';

dayjs.extend(utc);
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Paragon Social' : 'Gitroom'} Preview`,
  description: '',
};
export default async function Auth(
  props: {
    params: Promise<{
      id: string;
    }>;
    searchParams?: Promise<{
      share?: string;
    }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const {
    id
  } = params;

  const post = await (await internalFetch(`/public/posts/${id}`)).json();
  const t = await getT();
  if (!post.length) {
    return (
      <div className="text-[#111214] fixed start-0 top-0 w-full h-full flex justify-center items-center text-[20px] bg-[#f6f7f8]">
        {t('post_not_found', 'Post not found')}
      </div>
    );
  }
  return (
    <PreviewCommentsProvider
      previewId={id}
      postIds={post.map((p: any) => p.id)}
      organizationId={post[0].organizationId}
    >
      {/* Paragon Social: client review page of the design */}
      <div className="min-h-screen w-full bg-[#f6f7f8] text-[#111214] flex flex-col">
        <header className="flex flex-wrap items-center justify-between gap-[12px] px-[32px] py-[16px] mobile:px-[16px] bg-white border-b border-[#eceef1]">
          <Link href="/" className="text-[#111214] [&>svg]:h-[24px] [&>svg]:w-auto">
            <LogoTextComponent />
          </Link>
          <div className="flex items-center gap-[16px] text-[13px] text-[#5d616a]">
            <span>
              {t('paragon_review_for', 'View for')}{' '}
              <b className="text-[#111214]">{post[0].integration.name}</b>
            </span>
            {!!searchParams?.share && <CopyClient />}
          </div>
        </header>
        <div className="flex flex-wrap gap-[28px] p-[32px] mobile:p-[16px] w-full max-w-[1240px] mx-auto">
          <section className="flex-[1_1_420px] max-w-[560px] flex flex-col gap-[14px] min-w-0">
            <h1 className="m-0 font-heading text-[26px] font-[700] -tracking-[0.5px]">
              {t('paragon_review_title', 'Review this post')}
            </h1>
            <p className="m-0 text-[14px] text-[#5d616a]">
              {post[0].integration.name} ·{' '}
              {t('paragon_review_scheduled', 'Scheduled for')}{' '}
              <RenderPreviewDateClient date={post[0].publishDate} />
            </p>
            {post.map((p: any, index: number) => (
              <article
                key={String(p.id)}
                className="bg-white border border-[#eceef1] rounded-[22px] overflow-hidden"
              >
                <div className="flex items-center gap-[10px] px-[16px] py-[14px]">
                  <div className="relative shrink-0">
                    <img
                      className="w-[36px] h-[36px] rounded-full object-cover bg-[#f6f7f8]"
                      alt={post[0].integration.name}
                      src={post[0].integration.picture}
                    />
                    <PlatformIcon
                      identifier={post[0].integration.providerIdentifier}
                      size={16}
                      channel={post[0].integration.profile || ''}
                      className="absolute -end-[4px] -bottom-[4px] z-[20]"
                      iconClassName="w-[16px] h-[16px] rounded-full"
                      markClassName="bg-white"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[14px] font-[600] truncate">
                      {post[0].integration.name}
                    </span>
                    {!!post[0].integration.profile && (
                      <span className="text-[12px] text-[#6b6f78] truncate">
                        @{post[0].integration.profile}
                      </span>
                    )}
                  </div>
                  {index === 0 && (
                    <CreationMethodBadge
                      creationMethod={p.creationMethod}
                      size="md"
                    />
                  )}
                </div>
                <div className="px-[16px] pb-[14px] text-[14px] leading-[1.55]">
                  <PostContentClient
                    postId={p.id}
                    html={sanitizePostContent(p.content)}
                  />
                </div>
                {!!JSON.parse(p?.image || '[]').length && (
                  <div className="flex w-full gap-[2px] bg-[#f6f7f8]">
                    {JSON.parse(p?.image || '[]').map((p: any) => (
                      <div
                        key={p.name}
                        className="flex-1 max-h-[560px] overflow-hidden"
                      >
                        <VideoOrImage
                          isContain={true}
                          src={p.path}
                          autoplay={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </section>
          <aside className="flex-[1_1_340px] min-w-0 self-start bg-white border border-[#eceef1] rounded-[22px] p-[20px] lg:sticky lg:top-[16px]">
            <CommentsComponents
              previewId={id}
              approvalStatus={post[0].approvalStatus}
            />
          </aside>
        </div>
      </div>
    </PreviewCommentsProvider>
  );
}
