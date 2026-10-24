export interface SceneDetails { title: string; filePath: string }
const P = 'src/components/video/video_scenes/';
export const SCENE_DETAILS: Record<string, SceneDetails> = {
  hook: { title: 'Today briefing', filePath: `${P}Scene1.tsx` },
  gap: { title: 'Tell Munim', filePath: `${P}Scene2.tsx` },
  tell: { title: 'Approve reminders', filePath: `${P}Scene3.tsx` },
  agent: { title: 'Customer pays', filePath: `${P}Scene4.tsx` },
  paid: { title: 'Gap closes', filePath: `${P}Scene5.tsx` },
  lockup: { title: 'Recap', filePath: `${P}Scene6.tsx` },
};
