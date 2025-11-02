module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式（不影响功能）
        'refactor', // 重构（既不是feat也不是fix）
        'perf',     // 性能优化
        'test',     // 测试相关
        'build',    // 构建相关
        'ci',       // CI配置
        'chore',    // 其他修改
        'revert',   // 回滚
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
  },
};