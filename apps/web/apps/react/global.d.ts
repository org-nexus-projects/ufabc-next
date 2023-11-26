declare module '*.svg' {
  const content: string;
  export default content;
}

declare module 'react-alert-template-basic' {
  const AlertTemplateBasic: import('@types/react').ComponentType<
    import('react-alert').AlertTemplateProps
  >;
  export default AlertTemplateBasic;
}
