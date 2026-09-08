// apps.js — アプリ定義のレジストリ（シェルフ・ランチャー共通の単一ソース）
//
// icon は index.html のシェルフボタンと同一の Material Symbols グリフ
// （Private Use Area のコードポイント）を使い、見た目を揃えている。
// このモジュールは純粋なデータ定義のみを持つ（他モジュールへの import なし）。

export const APP_DEFS = {
    calculator: { id: 'calculator', title: 'Calculator', url: 'https://gcalc.pages.dev/', icon: '\uEA5F' },
    browser: { id: 'browser', title: 'Browser', url: 'https://www.google.com/search?igu=1', icon: '\uE2DB' },
    mail: { id: 'mail', title: 'Mail', url: 'https://mail.google.com/', icon: '\uE158' },
    calendar: { id: 'calendar', title: 'Calendar', url: 'https://calendar.zyn.f5.si/', icon: '\uE935' },
    chat: { id: 'chat', title: 'Chat', url: 'https://chat.google.com/', icon: '\uE0B7' }
};

// カスタムURLウィンドウなど、定義外アプリのシェルフボタンに使う汎用グリフ
export const GENERIC_APP_ICON = '\uE837';

// ランチャーのグリッド表示順（タイトルのアルファベット順）
export const APP_LIST = Object.values(APP_DEFS)
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title));
