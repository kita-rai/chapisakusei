# PROJECT_STATE
- 2026-10-29: 配布先を kita-rai/chapisakusei の /animation/ に変更。トップ一覧から除外し noindex を設定。認証機能はなく、URLを知れば閲覧可能。
- 中核: TypeScript / PixiJS WebGL2、三角mesh・4weight skinning、14bone/IK、固定刻みspring。Canvasはマスク・画像編集。
- 画像は端末内処理。MediaPipe/MobileSAM/LaMaは必要時取得。静的配信モデルはSHA256検証後40MiB以下に分割し、ブラウザで結合。ONNXは1thread WASM fallback。
- 保存: ZIPプロジェクト・IndexedDB、PNG/連番/ブラウザWebCodecs MP4/MediaRecorder WebM。
- ビルド: animation-studio branchで .github/workflows/build-animation.yml がtest→モデル検証→build→animation/更新。生成commit確認後mainへmergeし既存Pagesで公開。
- 元設計: DESIGN_REVIEW.md。1人物・小〜中動作。自動解析は候補、アニメ絵や遮蔽は手動補正が必要。Windows native/Tauri/FFmpeg移行はWeb配信の対象外。
- 今回: 透明境界alpha二重適用、静止時の胸変形、拡縮中IK/接地、GPU領域保持、録画中操作、補正brushを修正。検証結果はWEB_DEPLOYMENT.mdへ記録。
