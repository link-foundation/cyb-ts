import { CodegenConfig } from '@graphql-codegen/cli';

const schemaUrl = 'https://index.bostrom.cybernode.ai/v1/graphql'; //process.env.NEXT_PUBLIC_GRAPHQL_HOST;

const config: CodegenConfig = {
  overwrite: true,
  schema: schemaUrl,
  documents: ['src/**/*.graphql'],
  config: {
    withHooks: true,
    namingConvention: {
      transformUnderscore: true,
    },
  },
  generates: {
    'src/generated/graphql.ts': {
      plugins: [
        {
          typescript: {
            namingConvention: {
              transformUnderscore: true,
            },
          },
        },
        'typescript-operations',
        'typescript-react-apollo',
      ],
    },
  },
};

export default config;
