module.exports = {
  ci: {
    collect: {
      staticDistDir: '.', // ビルド成果物があるフォルダ
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci', // ここに出力される
    },
  },
};
