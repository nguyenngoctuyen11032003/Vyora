import { AppFooter } from "@/src/components/layout/app-footer";
import { AppHeader } from "@/src/components/layout/app-header";
import { PageContainer } from "@/src/components/shared/page-container";
import { WorkoutHero } from "@/src/components/workout/workout-hero";
import { WorkoutPlanner } from "@/src/components/workout/workout-planner";
import { workoutPlan } from "@/src/data/workout-plan";

export default function Home() {
  return (
    <div className="min-h-dvh text-foreground">
      <AppHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageContainer>
          <WorkoutHero />
          <WorkoutPlanner initialDayId="monday" initialTodayId="monday" plan={workoutPlan} />
        </PageContainer>
      </main>
      <AppFooter />
    </div>
  );
}
