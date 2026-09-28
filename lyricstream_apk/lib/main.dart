import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF050609),
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const LyricStreamApp());
}

class LyricStreamApp extends StatelessWidget {
  const LyricStreamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF050609),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFD76CFF),
          secondary: Color(0xFF61E8FF),
          surface: Color(0xFF10121A),
        ),
        fontFamily: 'sans',
        useMaterial3: true,
      ),
      home: const HomeShell(),
    );
  }
}

enum AuraTheme { aurora, prism, ember, mint, mono }

class OverlayModel extends ChangeNotifier {
  static const channel = MethodChannel('lyricstream/overlay');

  double strength = 0.72;
  double spread = 0.68;
  double fontScale = 1.0;
  double opacity = 0.95;
  double syncMs = 0;
  bool reduceMotion = false;
  bool highContrast = false;
  bool overlayRunning = false;
  AuraTheme theme = AuraTheme.aurora;

  Future<void> refresh() async {
    try {
      overlayRunning = (await channel.invokeMethod<bool>('isOverlayRunning')) ?? false;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> requestOverlay() async {
    await channel.invokeMethod('requestOverlayPermission');
  }

  Future<void> requestMedia() async {
    await channel.invokeMethod('openNotificationAccess');
  }

  Future<void> start() async {
    try {
      await channel.invokeMethod('startOverlay');
      overlayRunning = true;
      notifyListeners();
      await push();
    } catch (_) {}
  }

  Future<void> stop() async {
    try {
      await channel.invokeMethod('stopOverlay');
    } catch (_) {}
    overlayRunning = false;
    notifyListeners();
  }

  Future<void> push() async {
    try {
      await channel.invokeMethod('updateSettings', {
        'strength': strength,
        'spread': spread,
        'fontScale': fontScale,
        'opacity': opacity,
        'syncMs': syncMs.round(),
        'reduceMotion': reduceMotion,
        'highContrast': highContrast,
        'theme': theme.name,
      });
    } catch (_) {}
    notifyListeners();
  }

  void setStrength(double v) { strength = v; push(); }
  void setSpread(double v) { spread = v; push(); }
  void setFont(double v) { fontScale = v; push(); }
  void setOpacity(double v) { opacity = v; push(); }
  void setSync(double v) { syncMs = v; push(); }
  void setTheme(AuraTheme v) { theme = v; push(); }
  void setReduceMotion(bool v) { reduceMotion = v; push(); }
  void setHighContrast(bool v) { highContrast = v; push(); }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> with TickerProviderStateMixin {
  final model = OverlayModel();
  int index = 0;
  late final AnimationController ambient;

  @override
  void initState() {
    super.initState();
    ambient = AnimationController(vsync: this, duration: const Duration(seconds: 9))..repeat();
    model.refresh();
  }

  @override
  void dispose() {
    ambient.dispose();
    model.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([ambient, model]),
      builder: (context, _) {
        return Scaffold(
          body: Stack(
            children: [
              Positioned.fill(child: CustomPaint(painter: AmbientPainter(ambient.value, model.theme))),
              SafeArea(
                bottom: false,
                child: Column(
                  children: [
                    _Header(running: model.overlayRunning),
                    Expanded(
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 360),
                        switchInCurve: Curves.easeOutCubic,
                        switchOutCurve: Curves.easeInCubic,
                        child: switch (index) {
                          0 => Dashboard(key: const ValueKey('home'), model: model, phase: ambient.value),
                          1 => Studio(key: const ValueKey('studio'), model: model, phase: ambient.value),
                          2 => SyncLab(key: const ValueKey('sync'), model: model),
                          _ => SettingsPage(key: const ValueKey('settings'), model: model),
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: _BottomBar(
            index: index,
            onChanged: (v) => setState(() => index = v),
          ),
        );
      },
    );
  }
}

class _Header extends StatelessWidget {
  final bool running;
  const _Header({required this.running});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 18, 8),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const SweepGradient(colors: [
                Color(0xFF5FE9FF), Color(0xFFB76CFF), Color(0xFFFF5AA5), Color(0xFF5FE9FF)
              ]),
              boxShadow: [BoxShadow(color: const Color(0xFFB76CFF).withOpacity(.28), blurRadius: 24)],
            ),
            child: const Center(
              child: SizedBox(width: 25, height: 25, child: DecoratedBox(
                decoration: BoxDecoration(shape: BoxShape.circle, color: Color(0xFF090A10)),
                child: Icon(Icons.graphic_eq_rounded, size: 15, color: Colors.white),
              )),
            ),
          ),
          const SizedBox(width: 11),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('LyricStream', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: -.4)),
              Text('LUMINOUS 13', style: TextStyle(fontSize: 9, letterSpacing: 1.8, color: Color(0xFF8E92A6))),
            ],
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(
              color: running ? const Color(0xFF61E8FF).withOpacity(.08) : Colors.white.withOpacity(.035),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: running ? const Color(0xFF61E8FF).withOpacity(.24) : Colors.white.withOpacity(.06)),
            ),
            child: Row(children: [
              Container(width: 6, height: 6, decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: running ? const Color(0xFF61E8FF) : const Color(0xFF6A6E7F),
                boxShadow: running ? [const BoxShadow(color: Color(0xFF61E8FF), blurRadius: 9)] : null,
              )),
              const SizedBox(width: 6),
              Text(running ? 'LIVE' : 'IDLE', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1)),
            ]),
          ),
        ],
      ),
    );
  }
}

class Dashboard extends StatelessWidget {
  final OverlayModel model;
  final double phase;
  const Dashboard({super.key, required this.model, required this.phase});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 120),
      children: [
        SizedBox(
          height: 310,
          child: _Glass(
            radius: 30,
            padding: EdgeInsets.zero,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(30),
              child: Stack(
                children: [
                  Positioned.fill(child: CustomPaint(painter: PreviewBackdropPainter(phase))),
                  Positioned.fill(child: CustomPaint(painter: LyricPreviewPainter(
                    phase: phase,
                    strength: model.strength,
                    spread: model.spread,
                    fontScale: model.fontScale,
                    theme: model.theme,
                    highContrast: model.highContrast,
                  ))),
                  const Positioned(
                    left: 18, top: 17,
                    child: Text('LIVE HUD PREVIEW', style: TextStyle(fontSize: 9, letterSpacing: 1.7, color: Color(0xFFB6B9C9))),
                  ),
                  Positioned(
                    right: 14, top: 13,
                    child: Container(
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.black.withOpacity(.28),
                        border: Border.all(color: Colors.white.withOpacity(.08)),
                      ),
                      child: const Icon(Icons.fullscreen_rounded, size: 16),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 18),
        Row(children: [
          Expanded(child: _ActionButton(
            label: model.overlayRunning ? 'Overlay aktif' : 'Overlay’i başlat',
            icon: model.overlayRunning ? Icons.bolt_rounded : Icons.play_arrow_rounded,
            primary: true,
            onTap: model.overlayRunning ? null : model.start,
          )),
          const SizedBox(width: 10),
          _SquareButton(icon: Icons.stop_rounded, onTap: model.overlayRunning ? model.stop : null),
        ]),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: _MiniCard(
            title: 'Aura',
            value: model.theme.name.toUpperCase(),
            icon: Icons.blur_on_rounded,
          )),
          const SizedBox(width: 10),
          Expanded(child: _MiniCard(
            title: 'Latency',
            value: (model.syncMs / 1000).toStringAsFixed(2) + ' s',
            icon: Icons.sync_rounded,
          )),
        ]),
        const SizedBox(height: 18),
        const _SectionTitle('Hızlı kurulum', 'İki izin, sonra oyununa dön.'),
        const SizedBox(height: 10),
        _PermissionTile(
          icon: Icons.layers_rounded,
          title: 'Ekran üstü gösterim',
          subtitle: 'Lyrics HUD diğer uygulamaların üzerinde görünür.',
          onTap: model.requestOverlay,
        ),
        const SizedBox(height: 8),
        _PermissionTile(
          icon: Icons.music_note_rounded,
          title: 'Müzik erişimi',
          subtitle: 'Aktif medya oturumunu ve playback süresini okur.',
          onTap: model.requestMedia,
        ),
      ],
    );
  }
}

class Studio extends StatelessWidget {
  final OverlayModel model;
  final double phase;
  const Studio({super.key, required this.model, required this.phase});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 120),
      children: [
        const _SectionTitle('Studio', 'HUD’u gerçek zamanlı şekillendir.'),
        const SizedBox(height: 12),
        SizedBox(
          height: 220,
          child: _Glass(
            radius: 28,
            padding: EdgeInsets.zero,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: CustomPaint(
                painter: LyricPreviewPainter(
                  phase: phase, strength: model.strength, spread: model.spread,
                  fontScale: model.fontScale, theme: model.theme,
                  highContrast: model.highContrast,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 18),
        _Glass(child: Column(children: [
          _SliderRow('Aura gücü', model.strength, 0.15, 1.0, model.setStrength),
          _SliderRow('Işık yayılımı', model.spread, 0.2, 1.0, model.setSpread),
          _SliderRow('Yazı ölçeği', model.fontScale, .75, 1.35, model.setFont),
          _SliderRow('Opaklık', model.opacity, .45, 1.0, model.setOpacity),
        ])),
        const SizedBox(height: 12),
        _Glass(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('AURA DNA', style: TextStyle(fontSize: 10, letterSpacing: 1.5, color: Color(0xFF9599AA))),
            const SizedBox(height: 12),
            Wrap(
              spacing: 9, runSpacing: 9,
              children: AuraTheme.values.map((t) => _ThemeChip(
                theme: t, selected: model.theme == t, onTap: () => model.setTheme(t)
              )).toList(),
            ),
          ],
        )),
        const SizedBox(height: 12),
        _Glass(child: Column(children: [
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Reduce Motion'),
            subtitle: const Text('Buhar ve spring animasyonlarını azalt.', style: TextStyle(fontSize: 12, color: Color(0xFF8E92A6))),
            value: model.reduceMotion,
            onChanged: model.setReduceMotion,
          ),
          Divider(color: Colors.white.withOpacity(.06)),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('High Contrast'),
            subtitle: const Text('Parlak oyun sahnelerinde okunabilirliği yükselt.', style: TextStyle(fontSize: 12, color: Color(0xFF8E92A6))),
            value: model.highContrast,
            onChanged: model.setHighContrast,
          ),
        ])),
      ],
    );
  }
}

class SyncLab extends StatelessWidget {
  final OverlayModel model;
  const SyncLab({super.key, required this.model});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 120),
      children: [
        const _SectionTitle('Sync Lab', 'Sözü müziğin nefesine oturt.'),
        const SizedBox(height: 14),
        _Glass(radius: 28, child: Column(
          children: [
            Container(
              width: 82, height: 82,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFFDA6DFF).withOpacity(.42),
                  const Color(0xFF61E8FF).withOpacity(.08),
                  Colors.transparent,
                ]),
              ),
              child: const Icon(Icons.graphic_eq_rounded, size: 34),
            ),
            const SizedBox(height: 10),
            Text((model.syncMs >= 0 ? '+' : '') + model.syncMs.round().toString() + ' ms',
              style: const TextStyle(fontSize: 31, fontWeight: FontWeight.w700, letterSpacing: -1.2)),
            const SizedBox(height: 4),
            const Text('GLOBAL OFFSET', style: TextStyle(fontSize: 9, letterSpacing: 1.6, color: Color(0xFF9296A8))),
            Slider(
              min: -2500, max: 2500, divisions: 100,
              value: model.syncMs,
              onChanged: model.setSync,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _Nudge(label: '-0.50', onTap: () => model.setSync((model.syncMs - 500).clamp(-2500, 2500).toDouble())),
                const SizedBox(width: 8),
                _Nudge(label: '-0.10', onTap: () => model.setSync((model.syncMs - 100).clamp(-2500, 2500).toDouble())),
                const SizedBox(width: 8),
                _Nudge(label: '+0.10', onTap: () => model.setSync((model.syncMs + 100).clamp(-2500, 2500).toDouble())),
                const SizedBox(width: 8),
                _Nudge(label: '+0.50', onTap: () => model.setSync((model.syncMs + 500).clamp(-2500, 2500).toDouble())),
              ],
            ),
          ],
        )),
        const SizedBox(height: 12),
        const _Glass(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nasıl çalışıyor?', style: TextStyle(fontWeight: FontWeight.w600)),
            SizedBox(height: 7),
            Text('MediaSession playback konumuna global offset uygulanır. Şarkı değiştiğinde LRC yeniden hizalanır; seek/pause/resume konumu otomatik takip edilir.',
              style: TextStyle(height: 1.45, color: Color(0xFFADB0BE), fontSize: 13)),
          ],
        )),
      ],
    );
  }
}

class SettingsPage extends StatelessWidget {
  final OverlayModel model;
  const SettingsPage({super.key, required this.model});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 120),
      children: [
        const _SectionTitle('Ayarlar', 'İzinler ve overlay yaşam döngüsü.'),
        const SizedBox(height: 14),
        _PermissionTile(icon: Icons.layers_outlined, title: 'Overlay izni', subtitle: 'Sistem ekran üstü gösterim sayfasını aç.', onTap: model.requestOverlay),
        const SizedBox(height: 8),
        _PermissionTile(icon: Icons.notifications_active_outlined, title: 'Notification access', subtitle: 'MediaSession için bildirim erişimini aç.', onTap: model.requestMedia),
        const SizedBox(height: 8),
        _PermissionTile(icon: Icons.refresh_rounded, title: 'Ayarları HUD’a gönder', subtitle: 'Renderer durumunu elle yenile.', onTap: model.push),
        const SizedBox(height: 18),
        _Glass(child: const Row(children: [
          Icon(Icons.shield_outlined, color: Color(0xFF61E8FF)),
          SizedBox(width: 12),
          Expanded(child: Text('Locked modda lyric yüzeyi dokunmaları oyuna geçirir. Yalnızca minik orb dokunulabilir kalır.',
            style: TextStyle(fontSize: 12.5, color: Color(0xFFADB0BE), height: 1.4))),
        ])),
      ],
    );
  }
}

class _BottomBar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onChanged;
  const _BottomBar({required this.index, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    const icons = [Icons.home_rounded, Icons.tune_rounded, Icons.sync_rounded, Icons.settings_rounded];
    const labels = ['Home', 'Studio', 'Sync', 'Ayarlar'];
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 6, 14, 10),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(27),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              height: 66,
              decoration: BoxDecoration(
                color: const Color(0xFF11131B).withOpacity(.78),
                borderRadius: BorderRadius.circular(27),
                border: Border.all(color: Colors.white.withOpacity(.07)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: List.generate(4, (i) {
                  final active = i == index;
                  return InkWell(
                    borderRadius: BorderRadius.circular(22),
                    onTap: () => onChanged(i),
                    child: SizedBox(
                      width: 72,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 260),
                            width: active ? 31 : 24, height: active ? 31 : 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: active ? const LinearGradient(colors: [Color(0xFF63E9FF), Color(0xFFD06CFF)]) : null,
                              color: active ? null : Colors.transparent,
                              boxShadow: active ? [BoxShadow(color: const Color(0xFFB76CFF).withOpacity(.22), blurRadius: 15)] : null,
                            ),
                            child: Icon(icons[i], size: active ? 17 : 18, color: active ? const Color(0xFF080910) : const Color(0xFF8E92A6)),
                          ),
                          const SizedBox(height: 2),
                          Text(labels[i], style: TextStyle(fontSize: 9.5, color: active ? Colors.white : const Color(0xFF777B8E))),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Glass extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  final double radius;
  const _Glass({required this.child, this.padding = const EdgeInsets.all(16), this.radius = 22});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: const Color(0xFF10121A).withOpacity(.72),
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: Colors.white.withOpacity(.065)),
          ),
          child: child,
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title, subtitle;
  const _SectionTitle(this.title, this.subtitle);
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(title, style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w700, letterSpacing: -.6)),
    const SizedBox(height: 3),
    Text(subtitle, style: const TextStyle(fontSize: 12.5, color: Color(0xFF8E92A6))),
  ]);
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool primary;
  final VoidCallback? onTap;
  const _ActionButton({required this.label, required this.icon, required this.primary, this.onTap});

  @override
  Widget build(BuildContext context) => FilledButton(
    onPressed: onTap,
    style: FilledButton.styleFrom(
      minimumSize: const Size.fromHeight(52),
      backgroundColor: primary ? const Color(0xFFF0E9FF) : const Color(0xFF171923),
      foregroundColor: primary ? const Color(0xFF111018) : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
    ),
    child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(icon, size: 19), const SizedBox(width: 8),
      Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
    ]),
  );
}

class _SquareButton extends StatelessWidget {
  final IconData icon; final VoidCallback? onTap;
  const _SquareButton({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) => IconButton.filledTonal(
    onPressed: onTap, icon: Icon(icon), style: IconButton.styleFrom(minimumSize: const Size(52, 52)),
  );
}

class _MiniCard extends StatelessWidget {
  final String title, value; final IconData icon;
  const _MiniCard({required this.title, required this.value, required this.icon});
  @override
  Widget build(BuildContext context) => _Glass(child: Row(children: [
    Icon(icon, size: 20, color: const Color(0xFFC77BFF)), const SizedBox(width: 10),
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(fontSize: 10, color: Color(0xFF8E92A6))),
      const SizedBox(height: 2),
      Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
    ])),
  ]));
}

class _PermissionTile extends StatelessWidget {
  final IconData icon; final String title, subtitle; final VoidCallback onTap;
  const _PermissionTile({required this.icon, required this.title, required this.subtitle, required this.onTap});
  @override
  Widget build(BuildContext context) => _Glass(child: InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(18),
    child: Row(children: [
      Container(width: 42, height: 42, decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFFB76CFF).withOpacity(.09)),
        child: Icon(icon, size: 20, color: const Color(0xFFD498FF))),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 3),
        Text(subtitle, style: const TextStyle(fontSize: 11.5, color: Color(0xFF8E92A6), height: 1.3)),
      ])),
      const Icon(Icons.chevron_right_rounded, color: Color(0xFF747889)),
    ]),
  ));
}

class _SliderRow extends StatelessWidget {
  final String label; final double value, min, max; final ValueChanged<double> onChanged;
  const _SliderRow(this.label, this.value, this.min, this.max, this.onChanged);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(children: [
      SizedBox(width: 92, child: Text(label, style: const TextStyle(fontSize: 12.5, color: Color(0xFFB5B8C6)))),
      Expanded(child: Slider(min: min, max: max, value: value.clamp(min, max).toDouble(), onChanged: onChanged)),
      SizedBox(width: 38, child: Text(value.toStringAsFixed(2), textAlign: TextAlign.right, style: const TextStyle(fontSize: 10, color: Color(0xFF818597)))),
    ]),
  );
}

class _ThemeChip extends StatelessWidget {
  final AuraTheme theme; final bool selected; final VoidCallback onTap;
  const _ThemeChip({required this.theme, required this.selected, required this.onTap});
  List<Color> get colors => switch (theme) {
    AuraTheme.aurora => const [Color(0xFF61E8FF), Color(0xFFC86CFF), Color(0xFFFF68A7)],
    AuraTheme.prism => const [Color(0xFF73A7FF), Color(0xFFEB72FF), Color(0xFFFFC85D)],
    AuraTheme.ember => const [Color(0xFFFFB052), Color(0xFFFF536B), Color(0xFFD73CFF)],
    AuraTheme.mint => const [Color(0xFF6CFFD6), Color(0xFF5AC8FF), Color(0xFF9E7BFF)],
    AuraTheme.mono => const [Color(0xFFFFFFFF), Color(0xFF9FA6BA), Color(0xFFFFFFFF)],
  };

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      padding: const EdgeInsets.fromLTRB(7, 7, 12, 7),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        color: selected ? Colors.white.withOpacity(.085) : Colors.white.withOpacity(.025),
        border: Border.all(color: selected ? colors[1].withOpacity(.42) : Colors.white.withOpacity(.055)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 18, height: 18, decoration: BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: colors),
          boxShadow: selected ? [BoxShadow(color: colors[1].withOpacity(.35), blurRadius: 10)] : null)),
        const SizedBox(width: 7),
        Text(theme.name.toUpperCase(), style: TextStyle(fontSize: 9, letterSpacing: .8, fontWeight: FontWeight.w700,
          color: selected ? Colors.white : const Color(0xFF8E92A6))),
      ]),
    ),
  );
}

class _Nudge extends StatelessWidget {
  final String label; final VoidCallback onTap;
  const _Nudge({required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) => OutlinedButton(
    onPressed: onTap,
    style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10), minimumSize: const Size(0, 38),
      side: BorderSide(color: Colors.white.withOpacity(.08))),
    child: Text(label, style: const TextStyle(fontSize: 10)),
  );
}

class AmbientPainter extends CustomPainter {
  final double phase; final AuraTheme theme;
  AmbientPainter(this.phase, this.theme);
  List<Color> get colors => switch (theme) {
    AuraTheme.ember => const [Color(0xFFFF4D75), Color(0xFFFFA24C)],
    AuraTheme.mint => const [Color(0xFF55FFD0), Color(0xFF58A6FF)],
    AuraTheme.mono => const [Color(0xFFFFFFFF), Color(0xFF6F7890)],
    _ => const [Color(0xFF5BEAFF), Color(0xFFC264FF)],
  };
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint();
    final a = Offset(size.width * (.18 + .05 * math.sin(phase * math.pi * 2)), size.height * .22);
    p.shader = RadialGradient(colors: [colors[0].withOpacity(.10), Colors.transparent]).createShader(Rect.fromCircle(center: a, radius: size.width * .62));
    canvas.drawCircle(a, size.width * .62, p);
    final b = Offset(size.width * (.88 + .04 * math.cos(phase * math.pi * 2)), size.height * .58);
    p.shader = RadialGradient(colors: [colors[1].withOpacity(.095), Colors.transparent]).createShader(Rect.fromCircle(center: b, radius: size.width * .72));
    canvas.drawCircle(b, size.width * .72, p);
  }
  @override bool shouldRepaint(covariant AmbientPainter old) => true;
}

class PreviewBackdropPainter extends CustomPainter {
  final double phase; PreviewBackdropPainter(this.phase);
  @override
  void paint(Canvas c, Size s) {
    c.drawRect(Offset.zero & s, Paint()..color = const Color(0xFF090B10));
    final p = Paint();
    for (var i = 0; i < 7; i++) {
      final x = s.width * ((i * .173 + phase * .015) % 1);
      final y = s.height * (.18 + (i % 4) * .21);
      p.color = Colors.white.withOpacity(.018 + (i % 3) * .007);
      c.drawCircle(Offset(x, y), 28 + i * 6, p);
    }
    p.shader = const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight,
      colors: [Color(0x221C2334), Color(0x00000000), Color(0x22130E1C)]).createShader(Offset.zero & s);
    c.drawRect(Offset.zero & s, p);
  }
  @override bool shouldRepaint(covariant PreviewBackdropPainter old) => true;
}

class LyricPreviewPainter extends CustomPainter {
  final double phase, strength, spread, fontScale;
  final AuraTheme theme;
  final bool highContrast;
  LyricPreviewPainter({required this.phase, required this.strength, required this.spread, required this.fontScale, required this.theme, required this.highContrast});

  List<Color> get colors => switch (theme) {
    AuraTheme.aurora => const [Color(0xFF55E6FF), Color(0xFFC76AFF), Color(0xFFFF65A5)],
    AuraTheme.prism => const [Color(0xFF69A7FF), Color(0xFFE96EFF), Color(0xFFFFC861)],
    AuraTheme.ember => const [Color(0xFFFFA64E), Color(0xFFFF526A), Color(0xFFD13EFF)],
    AuraTheme.mint => const [Color(0xFF5DFFD0), Color(0xFF5DC7FF), Color(0xFFA578FF)],
    AuraTheme.mono => const [Color(0xFFFFFFFF), Color(0xFFDDE2F0), Color(0xFF8C95AA)],
  };

  @override
  void paint(Canvas c, Size s) {
    final center = Offset(s.width * .5, s.height * .52);
    final radius = s.width * (.28 + spread * .31);
    final aura = Paint()..shader = RadialGradient(colors: [
      colors[1].withOpacity(.20 * strength),
      colors[2].withOpacity(.085 * strength),
      colors[0].withOpacity(.045 * strength),
      Colors.transparent
    ], stops: const [0, .35, .62, 1]).createShader(Rect.fromCircle(center: center, radius: radius));
    c.drawCircle(center, radius, aura);

    final orb = Offset(s.width * .115, s.height * .52);
    c.drawCircle(orb, 4.2, Paint()..shader = RadialGradient(colors: [Colors.white, colors[1], colors[0].withOpacity(0)]).createShader(Rect.fromCircle(center: orb, radius: 7)));
    c.drawCircle(orb, 1.7, Paint()..color = Colors.white);

    _text(c, s, 'Böyle günler olur', s.height * .35, 12 * fontScale, Colors.white.withOpacity(.28), FontWeight.w500);
    final activeSize = 28 * fontScale;
    final tp = TextPainter(
      text: TextSpan(text: 'Böyle günler olur', style: TextStyle(fontSize: activeSize, fontWeight: FontWeight.w700,
        foreground: Paint()..shader = LinearGradient(colors: colors).createShader(Rect.fromLTWH(0,0,s.width,50)),
        shadows: [Shadow(color: colors[1].withOpacity(.65 * strength), blurRadius: 18 * strength)])),
      textDirection: TextDirection.ltr, maxLines: 2, textAlign: TextAlign.center,
    )..layout(maxWidth: s.width * .78);
    tp.paint(c, Offset((s.width - tp.width)/2, s.height * .47));

    _text(c, s, 'Gecenin de geldi bana geri', s.height * .66, 12.5 * fontScale,
      highContrast ? Colors.white.withOpacity(.50) : Colors.white.withOpacity(.27), FontWeight.w500);

    final dots = Paint();
    for (var i=0; i<8; i++) {
      final ang = i * .79 + phase * math.pi * 2;
      final r = 42 + (i%3)*20;
      final pos = center + Offset(math.cos(ang)*r, math.sin(ang*.73)*r*.42);
      dots.color = colors[i % colors.length].withOpacity(.12 + .08 * math.sin(phase*math.pi*2+i).abs());
      c.drawCircle(pos, 1.1 + (i%2)*.7, dots);
    }
  }

  void _text(Canvas c, Size s, String t, double y, double fs, Color color, FontWeight weight) {
    final tp = TextPainter(text: TextSpan(text:t, style: TextStyle(fontSize: fs, color: color, fontWeight: weight)),
      textDirection: TextDirection.ltr, textAlign: TextAlign.center)..layout(maxWidth: s.width*.82);
    tp.paint(c, Offset((s.width-tp.width)/2,y));
  }
  @override bool shouldRepaint(covariant LyricPreviewPainter old) => true;
}
