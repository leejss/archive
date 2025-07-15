---
title: Nextjs `svgr` Configuration (Turbopack)
draft: false
publishedAt: 2025-07-15
tags: []
---

# Nextjs `svgr` Configuration (Turbopack)

## Turbopack Configuration

```ts
const nextConfig = {
  // ....

  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: "preset-default",
                    params: {
                      overrides: {
                        removeViewBox: false, // Keep viewBox attribute for responsive SVGs
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
        as: "*.js",
      },
    },
  },
};
```


## Webpack Configuration

[https://react-svgr.com/docs/next/](https://react-svgr.com/docs/next/)

```ts
module.exports = {
  webpack: config => {
    const fileLoaderRule = config.module.rules.find(rule => rule.test?.test?.('.svg'));
    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: {
                        removeViewBox: false,
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      }
    );
    fileLoaderRule.exclude = /\.svg$/i;
    return config;
  },

  // ...other config
}
```
