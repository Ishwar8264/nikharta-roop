declare module "sanscript" {
  const Sanscript: {
    t(
      input: string,
      from: string,
      to: string,
      options?: { syncope?: boolean },
    ): string;
  };

  export = Sanscript;
}
