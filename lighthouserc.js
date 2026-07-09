module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist', // あなたのビルド成果物があるフォルダ
      // startServerCommand: 'npm run start' // 必要なら
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci', // ここに出力される
    },
  },
};