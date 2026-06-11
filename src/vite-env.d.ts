// Declares Vite virtual modules used by the client application.

declare module "virtual:common-simple-icons" {
  export type CommonSimpleIcon = {
    slug: string;
    title: string;
    hex: string;
    path: string;
  };

  export const COMMON_SIMPLE_ICONS: CommonSimpleIcon[];
}
