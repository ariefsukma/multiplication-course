// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="App logo"
          width={120}
          height={24}
          priority
        />

        <div className={styles.intro}>
          <h1>Multiplication Learning Course</h1>
          <p>
            A mastery-based course for kids. Each lesson requires <b>50/50</b> to unlock the next.
          </p>
        </div>

        <div className={styles.ctas}>
          <Link className={styles.primary} href="/login">
            Start / Login
          </Link>

          <Link className={styles.secondary} href="/parent/lessons">
            Go to Lessons
          </Link>
        </div>
      </main>
    </div>
  );
}
