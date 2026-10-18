import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Crown,
  Calendar,
  Sparkles,
  Info,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  X,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';
import { RankAPI } from '../../services/api';
import { LeaderboardResponse, UserRankProfile, RankBadge } from '../../types';
import { useUserStore } from '../../store/userStore';

export const LeaderboardTab: React.FC = () => {
  const { currentUser } = useUserStore();
  const [timeframe, setTimeframe] = useState<'weekly' | 'all'>('weekly');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  const fetchLeaderboard = async (tf: 'weekly' | 'all') => {
    try {
      setIsLoading(true);
      const res = await RankAPI.getLeaderboard(tf);
      setData(res);
    } catch (err) {
      console.error('Lỗi khi tải bảng xếp hạng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(timeframe);
  }, [timeframe]);

  const handleRefresh = () => {
    fetchLeaderboard(timeframe);
  };

  const top1 = data?.leaderboard[0] || null;
  const top2 = data?.leaderboard[1] || null;
  const top3 = data?.leaderboard[2] || null;
  const remainingUsers = data?.leaderboard.slice(3) || [];

  const myRank = data?.myRank;

  // Calculate next tier progress
  const getNextTierInfo = (completed: number) => {
    if (completed < 10) {
      return {
        nextTitle: '🥈 Chăm Chỉ',
        remaining: 10 - completed,
        percentage: Math.min(100, Math.round((completed / 10) * 100))
      };
    }
    if (completed < 30) {
      return {
        nextTitle: '🥇 Chiến Thần',
        remaining: 30 - completed,
        percentage: Math.min(100, Math.round(((completed - 10) / 20) * 100))
      };
    }
    if (completed < 60) {
      return {
        nextTitle: '💎 Tinh Anh',
        remaining: 60 - completed,
        percentage: Math.min(100, Math.round(((completed - 30) / 30) * 100))
      };
    }
    if (completed < 100) {
      return {
        nextTitle: '👑 Huyền Thoại',
        remaining: 100 - completed,
        percentage: Math.min(100, Math.round(((completed - 60) / 40) * 100))
      };
    }
    return {
      nextTitle: 'Cấp tối đa (Huyền Thoại)',
      remaining: 0,
      percentage: 100
    };
  };

  const nextTierInfo = myRank ? getNextTierInfo(myRank.totalCompletedLessons) : null;

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* 1. Header Banner & Filters */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white p-6 sm:p-8 shadow-md">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-100 border border-white/20">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>BẢNG VINH DANH HỌC VIÊN OWNEDU</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
              Đua Top Bài Giảng • Chinh Phục Cấp Bậc
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 font-medium max-w-xl leading-relaxed">
              Mỗi bài học nhỏ hoàn thành là một bước tiến vươn lên đỉnh bảng vàng. Tích lũy kiến thức mỗi ngày để mở khóa danh hiệu vinh danh!
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Rule info button */}
            <button
              onClick={() => setShowRulesModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/20"
            >
              <Info className="w-4 h-4 text-amber-200" />
              <span>Thể lệ & Cấp bậc</span>
            </button>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer border border-white/20 disabled:opacity-50"
              title="Làm mới bảng xếp hạng"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Timeframe selector tabs */}
        <div className="mt-6 pt-5 border-t border-white/15 flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex p-1 rounded-2xl bg-black/20 backdrop-blur-md border border-white/15">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                timeframe === 'weekly'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Đua Top Tuần Này</span>
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                timeframe === 'all'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Bảng Vàng Toàn Thời Gian</span>
            </button>
          </div>

          {data && (
            <div className="flex items-center gap-4 text-xs font-bold text-amber-100">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-300" />
                <span>{data.stats.totalStudents} học viên</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>{data.stats.totalCompletedLessons} lượt hoàn thành bài học</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. My Rank Spotlight Card (Thẻ vị trí cá nhân) */}
      {myRank && (
        <div className="p-5 rounded-2xl bg-white border border-orange-200/90 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              {/* Position badge */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                #{myRank.rankPosition}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {myRank.fullName} (Bạn)
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${myRank.rankBadge.color}`}>
                    <span>{myRank.rankBadge.icon}</span>
                    <span>{myRank.rankBadge.title}</span>
                  </span>
                  {myRank.tier === 'PRO' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                      <Crown className="w-3 h-3 text-amber-600" />
                      <span>PRO VIP</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                  <span className="font-semibold text-slate-700">
                    Đã hoàn thành: <strong className="text-orange-600 font-bold">{myRank.totalCompletedLessons}</strong> bài học
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-700">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>Chuỗi {myRank.currentStreakDays} ngày liên tiếp</span>
                  </span>
                  {timeframe === 'weekly' && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500">
                        Tuần này: <strong className="text-slate-800">{myRank.weeklyCompletedLessons}</strong> bài
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Next tier progress bar */}
            {nextTierInfo && (
              <div className="w-full md:w-72 bg-orange-50/70 p-3.5 rounded-xl border border-orange-100 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Mục tiêu tiếp theo</span>
                  <span className="text-orange-600">{nextTierInfo.nextTitle}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${nextTierInfo.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 text-right">
                  {nextTierInfo.remaining > 0
                    ? `Chỉ còn ${nextTierInfo.remaining} bài nữa để thăng hạng!`
                    : 'Bạn đã đạt cấp bậc cao nhất! 🎉'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Top 3 Podium (Bục Vinh Quang) */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
          <Sparkles className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" />
          <p className="font-bold text-slate-700">Đang tải bảng vinh danh...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-6">
            {/* Top 2 - Á Quân 1 */}
            {top2 ? (
              <div className="order-2 md:order-1 p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col items-center text-center space-y-3 relative group transition">
                <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-200 text-slate-700 font-black text-xs border border-slate-300 shadow-2xs">
                  🥈 HẠNG 2
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 font-black text-2xl flex items-center justify-center shadow-md">
                  {top2.avatarChar}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{top2.fullName}</h4>
                  <p className="text-[11px] text-slate-400">{top2.email ? top2.email.replace(/(.{3})(.*)(@.*)/, '$1***$3') : 'Học viên'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${top2.rankBadge.color}`}>
                  <span>{top2.rankBadge.icon}</span>
                  <span>{top2.rankBadge.title}</span>
                </span>
                <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-around text-xs">
                  <div>
                    <span className="block font-black text-slate-900 text-base">
                      {timeframe === 'weekly' ? top2.weeklyCompletedLessons : top2.totalCompletedLessons}
                    </span>
                    <span className="text-[10px] text-slate-400">bài đã học</span>
                  </div>
                  <div className="h-6 w-px bg-slate-100" />
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>{top2.currentStreakDays} ngày</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Top 1 - Quán Quân (Cao nhất & Nổi bật nhất) */}
            {top1 ? (
              <div className="order-1 md:order-2 p-6 rounded-3xl bg-gradient-to-b from-amber-50/90 via-white to-orange-50/50 border-2 border-amber-400 shadow-lg flex flex-col items-center text-center space-y-3.5 relative group transform md:-translate-y-2">
                <div className="absolute -top-4 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-md flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-200" />
                  <span>QUÁN QUÂN #1</span>
                </div>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-3xl flex items-center justify-center shadow-lg ring-4 ring-amber-100">
                  {top1.avatarChar}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base line-clamp-1">{top1.fullName}</h4>
                  <p className="text-xs text-slate-400">{top1.email ? top1.email.replace(/(.{3})(.*)(@.*)/, '$1***$3') : 'Học viên'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border ${top1.rankBadge.color} shadow-xs`}>
                  <span>{top1.rankBadge.icon}</span>
                  <span>{top1.rankBadge.title}</span>
                </span>
                <div className="pt-2 border-t border-amber-100 w-full flex items-center justify-around text-xs">
                  <div>
                    <span className="block font-black text-orange-600 text-xl">
                      {timeframe === 'weekly' ? top1.weeklyCompletedLessons : top1.totalCompletedLessons}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">bài đã học</span>
                  </div>
                  <div className="h-8 w-px bg-amber-100" />
                  <div className="flex items-center gap-1 text-orange-600 font-extrabold">
                    <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                    <span>{top1.currentStreakDays} ngày</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Top 3 - Á Quân 2 */}
            {top3 ? (
              <div className="order-3 p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col items-center text-center space-y-3 relative group transition">
                <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-200 shadow-2xs">
                  🥉 HẠNG 3
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 font-black text-2xl flex items-center justify-center shadow-md">
                  {top3.avatarChar}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{top3.fullName}</h4>
                  <p className="text-[11px] text-slate-400">{top3.email ? top3.email.replace(/(.{3})(.*)(@.*)/, '$1***$3') : 'Học viên'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${top3.rankBadge.color}`}>
                  <span>{top3.rankBadge.icon}</span>
                  <span>{top3.rankBadge.title}</span>
                </span>
                <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-around text-xs">
                  <div>
                    <span className="block font-black text-slate-900 text-base">
                      {timeframe === 'weekly' ? top3.weeklyCompletedLessons : top3.totalCompletedLessons}
                    </span>
                    <span className="text-[10px] text-slate-400">bài đã học</span>
                  </div>
                  <div className="h-6 w-px bg-slate-100" />
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>{top3.currentStreakDays} ngày</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* 4. Leaderboard Table (Top 4 - 50) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">Bảng Tổng Sắp Học Viên</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Cập nhật theo thời gian thực
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 w-16 text-center">Thứ hạng</th>
                    <th className="py-3 px-4">Học viên</th>
                    <th className="py-3 px-4">Danh hiệu cấp bậc</th>
                    <th className="py-3 px-4 text-center">Số bài học</th>
                    <th className="py-3 px-4 text-center">Chuỗi Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {data?.leaderboard.map((user) => {
                    const isMe = user.userId === currentUser?.id;
                    const count = timeframe === 'weekly' ? user.weeklyCompletedLessons : user.totalCompletedLessons;

                    return (
                      <tr
                        key={user.userId}
                        className={`transition-colors ${
                          isMe ? 'bg-orange-50/60 font-semibold' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Position */}
                        <td className="py-3.5 px-4 text-center">
                          {user.rankPosition === 1 ? (
                            <span className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                              🥇
                            </span>
                          ) : user.rankPosition === 2 ? (
                            <span className="w-7 h-7 rounded-xl bg-slate-400 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                              🥈
                            </span>
                          ) : user.rankPosition === 3 ? (
                            <span className="w-7 h-7 rounded-xl bg-amber-700 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                              🥉
                            </span>
                          ) : (
                            <span className="font-bold text-slate-500 text-xs">
                              #{user.rankPosition}
                            </span>
                          )}
                        </td>

                        {/* User info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-2xs shrink-0">
                              {user.avatarChar}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 truncate">
                                  {user.fullName}
                                </span>
                                {isMe && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-orange-600 text-white">
                                    Bạn
                                  </span>
                                )}
                                {user.tier === 'PRO' && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                    <Crown className="w-2.5 h-2.5 text-amber-600" />
                                    PRO
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {user.email ? user.email.replace(/(.{3})(.*)(@.*)/, '$1***$3') : 'Học viên OwnEdu'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Rank Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${user.rankBadge.color}`}>
                            <span>{user.rankBadge.icon}</span>
                            <span>{user.rankBadge.title}</span>
                          </span>
                        </td>

                        {/* Lesson Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-black text-slate-900 text-sm">
                            {count}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">bài học</span>
                        </td>

                        {/* Streak */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            <span>{user.currentStreakDays} ngày</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Rules & Tiers Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hệ Thống Cấp Bậc & Quy Chuẩn</h3>
                <p className="text-xs text-slate-400">Cách tính thứ hạng và danh hiệu vinh danh</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                5 Cấp Bậc Danh Hiệu:
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥉</span>
                    <strong className="text-amber-900">Tân Binh (Newbie Scholar)</strong>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800">1 – 9 bài học</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥈</span>
                    <strong className="text-slate-900">Chăm Chỉ (Diligent Learner)</strong>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">10 – 29 bài học</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥇</span>
                    <strong className="text-amber-950">Chiến Thần (Study Warrior)</strong>
                  </div>
                  <span className="text-[11px] font-bold text-amber-900">30 – 59 bài học</span>
                </div>
                <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    <strong className="text-cyan-950">Tinh Anh (Elite Scholar)</strong>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-900">60 – 99 bài học</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👑</span>
                    <strong className="text-purple-950">Huyền Thoại (OwnEdu Master)</strong>
                  </div>
                  <span className="text-[11px] font-bold text-purple-900">100+ bài học</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Quy chuẩn công bằng:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Mỗi bài học nhỏ chỉ được cộng điểm 1 lần duy nhất khi bạn bấm hoàn thành.</li>
                <li>Bảng xếp hạng Tuần tự động đặt lại vào 00:00 Thứ 2 hàng tuần để học viên mới luôn có cơ hội đua top.</li>
                <li>Bảng xếp hạng Toàn thời gian ghi nhận tổng tích lũy từ ngày bắt đầu học.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Đã hiểu & Bắt đầu học ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
