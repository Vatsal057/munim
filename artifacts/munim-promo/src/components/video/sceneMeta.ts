export interface SceneDetails { title: string; filePath: string }
const P = 'src/components/video/video_scenes/';
export const SCENE_DETAILS: Record<string, SceneDetails> = {
  hook: { title: 'The counter', filePath: `${P}Scene1.tsx` },
  gap: { title: 'The cash gap', filePath: `${P}Scene2.tsx` },
  tell: { title: 'Tell it', filePath: `${P}Scene3.tsx` },
  agent: { title: 'Agent drafts', filePath: `${P}Scene4.tsx` },
  paid: { title: 'Paid', filePath: `${P}Scene5.tsx` },
  lockup: { title: 'Munim lockup', filePath: `${P}Scene6.tsx` },
};
