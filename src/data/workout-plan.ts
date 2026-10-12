import type { Exercise, WorkoutDay } from "@/src/types/workout";

const noVideo = (): Exercise["video"] => ({
  embedUrl: null,
  aspectRatio: "16:9",
});

const videos = {
  benchPress: {
    embedUrl: "https://www.youtube.com/embed/XjrsqShr-Ic",
    title: "✅ Bench Press LIKE THIS!",
    aspectRatio: "9:16",
  },
  inclineBenchPress: {
    embedUrl: "https://www.youtube.com/embed/8fXfwG4ftaQ",
    title: "The PERFECT Incline Dumbbell Chest Press",
    aspectRatio: "9:16",
  },
  dip: {
    embedUrl: "https://www.youtube.com/embed/eicOUO9WaJc",
    title: "Dips - KNOW THE DIFFERENCE!",
    aspectRatio: "9:16",
  },
  dumbbellFrontRaise: {
    embedUrl: "https://www.youtube.com/embed/9ThlTL25DH8",
    title: "Build 3D Shoulders (Dumbbells Only)",
    aspectRatio: "9:16",
  },
  dumbbellLateralRaise: {
    embedUrl: "https://www.youtube.com/embed/Kl3LEzQ5Zqs",
    title: "The Perfect Lateral Raise (DO THIS!)",
    aspectRatio: "9:16",
  },
  dumbbellReverseRaise: {
    embedUrl: "https://www.youtube.com/embed/LsT-bR_zxLo",
    title: "The PERFECT Dumbbell Rear Delt Fly (DO THIS!)",
    aspectRatio: "9:16",
  },
  cableTricepPushdown: {
    embedUrl: "https://www.youtube.com/embed/1FjkhpZsaxc",
    title: "The Perfect Triceps Pushdown (DO THIS!)",
    aspectRatio: "9:16",
  },
  squat: {
    embedUrl: "https://www.youtube.com/embed/iKCJCydYYrE",
    title: "✅ The PERFECT Smith Machine Squat",
    aspectRatio: "9:16",
  },
  walkingLunges: {
    embedUrl: "https://www.youtube.com/embed/mJilHWIBWO8",
    title: "✅ The PERFECT Dumbbell Static Lunge",
    aspectRatio: "9:16",
  },
  hipThrust: {
    embedUrl: "https://www.youtube.com/embed/CvuVYMFd11g",
    title: "❌ FIX THIS Hip Thrust Mistake!",
    aspectRatio: "9:16",
  },
  legExtension: {
    embedUrl: "https://www.youtube.com/embed/uM86QE59Tgc",
    title: "The PERFECT Leg Extension",
    aspectRatio: "9:16",
  },
  legCurl: {
    embedUrl: "https://www.youtube.com/embed/xdbEG3xGLI8",
    title: "✅ The PERFECT Seated Leg Curl Tips",
    aspectRatio: "9:16",
  },
  legPress: {
    embedUrl: "https://www.youtube.com/embed/EotSw18oR9w",
    title: "✅ The PERFECT Leg Press",
    aspectRatio: "9:16",
  },
  vSitUp: {
    embedUrl: "https://www.youtube.com/embed/6VkyB85fjwo",
    title: "V-Ups Correct technique #v-ups #crunches #fitness #workout #abs",
    aspectRatio: "9:16",
  },
  overheadPress: {
    embedUrl: "https://www.youtube.com/embed/k6tzKisR3NY",
    title: "The PERFECT Dumbbell Shoulder Press (DO THIS!)",
    aspectRatio: "9:16",
  },
  dumbbellShoulderPress: {
    embedUrl: "https://www.youtube.com/embed/6v4nrRVySj0",
    title: "✅ The PERFECT Machine Shoulder Press!",
    aspectRatio: "9:16",
  },
  dumbbellBenchPress: {
    embedUrl: "https://www.youtube.com/embed/Cj96ZZlmJRU",
    title: "Dumbell Chest Press Mistakes (DON'T DO THIS!)",
    aspectRatio: "9:16",
  },
  cableTricepExtension: {
    embedUrl: "https://www.youtube.com/embed/b_r_LW4HEcM",
    title: "✅ The PERFECT Overhead DB Tricep Extension",
    aspectRatio: "9:16",
  },
  deadlift: {
    embedUrl: "https://www.youtube.com/embed/xNwpvDuZJ3k",
    title: "✅ The PERFECT Deadlift (DO THIS!)",
    aspectRatio: "9:16",
  },
  pullUp: {
    embedUrl: "https://www.youtube.com/embed/eDP_OOhMTZ4",
    title: "The Perfect Pull-Up (FIX THESE!)",
    aspectRatio: "9:16",
  },
  barbellBentOverRow: {
    embedUrl: "https://www.youtube.com/embed/phVtqawIgbk",
    title: "✅ The PERFECT Barbell Row",
    aspectRatio: "9:16",
  },
  dumbbellBentOverRow: {
    embedUrl: "https://www.youtube.com/embed/yHqqGd0tXcw",
    title: "FIX THESE Dumbbell Row Mistakes!",
    aspectRatio: "9:16",
  },
  seatedRow: {
    embedUrl: "https://www.youtube.com/embed/qD1WZ5pSuvk",
    title: "Cable Row Form Tips (DO THIS!)",
    aspectRatio: "9:16",
  },
  latPulldown: {
    embedUrl: "https://www.youtube.com/embed/bNmvKpJSWKM",
    title: "✅ The PERFECT Lat Pulldown (DO THIS!)",
    aspectRatio: "9:16",
  },
  cableBicepCurl: {
    embedUrl: "https://www.youtube.com/embed/CrbTqNOlFgE",
    title: "✅ The PERFECT Cable Bicep Curl",
    aspectRatio: "9:16",
  },
  backExtension: {
    embedUrl: "https://www.youtube.com/embed/Wpreb69h2fE",
    title: "Hyper Extension Variations (KNOW THE DIFFERENCE!)",
    aspectRatio: "9:16",
  },
} satisfies Record<string, Exercise["video"]>;

const exercise = (
  id: string,
  name: string,
  vietnameseName: string,
  muscleGroups: string[],
  sets: number,
  reps: string,
  options: Partial<Pick<Exercise, "note" | "description" | "instructions" | "video">> = {},
): Exercise => ({
  id,
  name,
  vietnameseName,
  muscleGroups,
  sets,
  reps,
  description: `Hướng dẫn nhanh cho ${name}.`,
  instructions: ["Giữ nhịp thở đều và kiểm soát chuyển động trong toàn bộ biên độ."],
  video: noVideo(),
  ...options,
});

export const workoutPlan: WorkoutDay[] = [
  {
    id: "monday",
    dayNumber: 1,
    shortLabel: "Thứ 2",
    fullLabel: "Thứ 2",
    title: "Ngực, vai và tay sau",
    muscleGroups: ["Ngực", "Vai", "Tay sau"],
    description: "Ưu tiên kỹ thuật kiểm soát và tăng tải có chủ đích.",
    isRestDay: false,
    defaultVariant: "moderate",
    exercises: [
      exercise("bench-press", "Bench Press", "Đẩy ngực thanh đòn", ["Ngực"], 5, "14 / 12 / 10 / 8 / 6", {
        instructions: ["Giữ bả vai ổn định và kiểm soát thanh đòn trong toàn bộ chuyển động."],
        video: videos.benchPress,
      }),
      exercise("incline-bench-press", "Incline Bench Press", "Đẩy ngực dốc lên", ["Ngực trên"], 4, "14 / 12 / 10 / 8", {
        instructions: ["Giữ ngực mở, cổ tay thẳng và hạ tạ có kiểm soát."],
        video: videos.inclineBenchPress,
      }),
      exercise("dip", "Dip", "Xà kép", ["Ngực", "Tay sau"], 3, "Tối đa", {
        note: "Mục tiêu khoảng 8 rep mỗi set nếu thể lực cho phép.",
        video: videos.dip,
      }),
      exercise("dumbbell-front-raise", "Dumbbell Front Raise", "Nâng tạ trước", ["Vai trước"], 3, "15 mỗi set", {
        video: videos.dumbbellFrontRaise,
      }),
      exercise("dumbbell-lateral-raise", "Dumbbell Lateral Raise", "Nâng tạ ngang", ["Vai giữa"], 3, "15 mỗi set", {
        video: videos.dumbbellLateralRaise,
      }),
      exercise("dumbbell-reverse-raise", "Dumbbell Reverse Raise", "Nâng tạ vai sau", ["Vai sau"], 3, "15 mỗi set", {
        video: videos.dumbbellReverseRaise,
      }),
      exercise("cable-tricep-pushdown", "Cable Tricep Pushdown", "Kéo cáp tay sau", ["Tay sau"], 4, "15 mỗi set", {
        video: videos.cableTricepPushdown,
      }),
    ],
  },
  {
    id: "tuesday",
    dayNumber: 2,
    shortLabel: "Thứ 3",
    fullLabel: "Thứ 3",
    title: "Chân, mông và core",
    muscleGroups: ["Chân", "Mông", "Core"],
    description: "Giữ thân người ổn định và ưu tiên biên độ chuyển động an toàn.",
    isRestDay: false,
    defaultVariant: "vigorous",
    exercises: [
      exercise("squat", "Squat", "Gánh đùi", ["Đùi", "Mông"], 5, "14 / 12 / 10 / 8 / 6", {
        video: videos.squat,
      }),
      exercise("walking-lunges-tuesday", "Walking Lunges", "Chùng chân bước tới", ["Đùi", "Mông"], 4, "14 / 12 / 10 / 8 mỗi chân", {
        video: videos.walkingLunges,
      }),
      exercise("hip-thrust-tuesday", "Hip Thrust", "Đẩy hông", ["Mông"], 4, "14 / 12 / 10 / 8", {
        video: videos.hipThrust,
      }),
      exercise("leg-extension-tuesday", "Leg Extension", "Duỗi chân máy", ["Đùi trước"], 3, "14 / 12 / 10", {
        video: videos.legExtension,
      }),
      exercise("leg-curl-tuesday", "Leg Curl", "Cuốn chân máy", ["Đùi sau"], 3, "14 / 12 / 10", {
        video: videos.legCurl,
      }),
      exercise("leg-press-tuesday", "Leg Press", "Đạp đùi máy", ["Đùi", "Mông"], 4, "15 mỗi set", {
        video: videos.legPress,
      }),
      exercise("v-sit-up-tuesday", "V Sit-up", "Gập bụng chữ V", ["Core"], 4, "15 mỗi set", {
        video: videos.vSitUp,
      }),
    ],
  },
  {
    id: "wednesday",
    dayNumber: 3,
    shortLabel: "Thứ 4",
    fullLabel: "Thứ 4",
    title: "Lưng, xô và tay trước",
    muscleGroups: ["Lưng", "Xô", "Tay trước"],
    description: "Kéo bằng khuỷu tay và giữ cột sống trung lập.",
    isRestDay: false,
    defaultVariant: "moderate",
    exercises: [
      exercise("pull-up", "Pull-up", "Hít xà", ["Xô", "Lưng"], 5, "Tối đa", {
        video: videos.pullUp,
      }),
      exercise("barbell-bent-over-row", "Barbell Bent-over Row", "Kéo thanh đòn gập người", ["Lưng"], 4, "14 / 12 / 10 / 8", {
        video: videos.barbellBentOverRow,
      }),
      exercise("dumbbell-bent-over-row", "Dumbbell Bent-over Row", "Kéo tạ đơn gập người", ["Lưng", "Xô"], 4, "14 / 12 / 10 / 8 mỗi bên", {
        video: videos.dumbbellBentOverRow,
      }),
      exercise("seated-row", "Seated Row", "Kéo cáp ngồi", ["Lưng giữa"], 3, "15 mỗi set", {
        video: videos.seatedRow,
      }),
      exercise("lat-pulldown", "Lat Pulldown", "Kéo xô", ["Xô"], 3, "15 mỗi set", {
        video: videos.latPulldown,
      }),
      exercise("cable-bicep-curl", "Cable Bicep Curl", "Cuốn tay trước cáp", ["Tay trước"], 4, "15 mỗi set", {
        video: videos.cableBicepCurl,
      }),
      exercise("back-extension", "Back Extension", "Duỗi lưng", ["Lưng dưới"], 4, "15 mỗi set", {
        video: videos.backExtension,
      }),
    ],
  },
  {
    id: "thursday",
    dayNumber: 4,
    shortLabel: "Thứ 5",
    fullLabel: "Thứ 5",
    title: "Deadlift và chân",
    muscleGroups: ["Lưng dưới", "Chân", "Mông"],
    description: "Tập trung vào kỹ thuật hip hinge và kiểm soát nhịp hạ tạ.",
    isRestDay: false,
    defaultVariant: "vigorous",
    exercises: [
      exercise("deadlift", "Deadlift", "Kéo tạ", ["Lưng dưới", "Mông", "Đùi sau"], 5, "14 / 12 / 10 / 8 / 6", {
        video: videos.deadlift,
      }),
      exercise("walking-lunges-thursday", "Walking Lunges", "Chùng chân bước tới", ["Đùi", "Mông"], 4, "14 / 12 / 10 / 8 mỗi chân", {
        video: videos.walkingLunges,
      }),
      exercise("hip-thrust-thursday", "Hip Thrust", "Đẩy hông", ["Mông"], 4, "14 / 12 / 10 / 8", {
        video: videos.hipThrust,
      }),
      exercise("leg-extension-thursday", "Leg Extension", "Duỗi chân máy", ["Đùi trước"], 3, "14 / 12 / 10", {
        video: videos.legExtension,
      }),
      exercise("leg-curl-thursday", "Leg Curl", "Cuốn chân máy", ["Đùi sau"], 3, "14 / 12 / 10", {
        video: videos.legCurl,
      }),
      exercise("leg-press-thursday", "Leg Press", "Đạp đùi máy", ["Đùi", "Mông"], 4, "15 mỗi set", {
        video: videos.legPress,
      }),
      exercise("v-sit-up-thursday", "V Sit-up", "Gập bụng chữ V", ["Core"], 4, "15 mỗi set", {
        video: videos.vSitUp,
      }),
    ],
  },
  {
    id: "friday",
    dayNumber: 5,
    shortLabel: "Thứ 6",
    fullLabel: "Thứ 6",
    title: "Vai, ngực và tay sau",
    muscleGroups: ["Vai", "Ngực", "Tay sau"],
    description: "Ưu tiên vai ổn định, chuyển động mượt và không khóa khớp.",
    isRestDay: false,
    defaultVariant: "moderate",
    exercises: [
      exercise("overhead-press", "Overhead Press (OHP)", "Đẩy vai thanh đòn", ["Vai"], 5, "14 / 12 / 10 / 8 / 6", {
        video: videos.overheadPress,
      }),
      exercise("dumbbell-shoulder-press", "Dumbbell Shoulder Press", "Đẩy vai tạ đơn", ["Vai"], 4, "14 / 12 / 10 / 8", {
        video: videos.dumbbellShoulderPress,
      }),
      exercise("dumbbell-front-raise-friday", "Dumbbell Front Raise", "Nâng tạ trước", ["Vai trước"], 4, "15 mỗi set", {
        video: videos.dumbbellFrontRaise,
      }),
      exercise("dumbbell-lateral-raise-friday", "Dumbbell Lateral Raise", "Nâng tạ ngang", ["Vai giữa"], 4, "15 mỗi set", {
        video: videos.dumbbellLateralRaise,
      }),
      exercise("dumbbell-reverse-raise-friday", "Dumbbell Reverse Raise", "Nâng tạ vai sau", ["Vai sau"], 4, "15 mỗi set", {
        video: videos.dumbbellReverseRaise,
      }),
      exercise("dumbbell-bench-press", "Dumbbell Bench Press", "Đẩy ngực tạ đơn", ["Ngực"], 3, "15 mỗi set", {
        video: videos.dumbbellBenchPress,
      }),
      exercise("dumbbell-incline-bench-press", "Dumbbell Incline Bench Press", "Đẩy ngực dốc lên tạ đơn", ["Ngực trên"], 3, "15 mỗi set", {
        video: videos.inclineBenchPress,
      }),
      exercise("cable-tricep-extension", "Cable Tricep Extension", "Duỗi tay sau với cáp", ["Tay sau"], 4, "15 mỗi set", {
        video: videos.cableTricepExtension,
      }),
    ],
  },
  {
    id: "saturday",
    dayNumber: 6,
    shortLabel: "Thứ 7",
    fullLabel: "Thứ 7",
    title: "Ngày nghỉ phục hồi",
    muscleGroups: ["Phục hồi"],
    description: "Nghỉ ngơi, giãn cơ nhẹ hoặc đi bộ để cơ thể sẵn sàng cho tuần mới.",
    isRestDay: true,
    defaultVariant: "moderate",
    exercises: [],
  },
  {
    id: "sunday",
    dayNumber: 0,
    shortLabel: "CN",
    fullLabel: "Chủ nhật",
    title: "Ngày nghỉ phục hồi",
    muscleGroups: ["Phục hồi"],
    description: "Dành thời gian ngủ đủ, vận động nhẹ và chuẩn bị cho buổi tập Thứ 2.",
    isRestDay: true,
    defaultVariant: "moderate",
    exercises: [],
  },
];
