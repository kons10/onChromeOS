module.exports = {
  ci: {
    collect: {
      staticDistDir: '.', // あなたのビルド成果物があるフォルダ
      // startServerCommand: 'npm run start' // 必要なら
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci', // ここに出力される
    },
  },
};
