const optionButtons = [...document.querySelectorAll(".option")];
const messageEl = document.getElementById("message");
const resultsEl = document.getElementById("results");
const totalVotesEl = document.getElementById("totalVotes");
const modeTextEl = document.getElementById("modeText");

const hasSupabaseConfig =
  typeof SUPABASE_URL === "string" &&
  typeof SUPABASE_ANON_KEY === "string" &&
  !SUPABASE_URL.includes("YOUR_") &&
  !SUPABASE_ANON_KEY.includes("YOUR_");

let sb = null;

function getDeviceId() {
  let id = localStorage.getItem("euler_vote_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("euler_vote_device_id", id);
  }
  return id;
}

const deviceId = getDeviceId();

function setSelected(option) {
  optionButtons.forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.option === option);
    btn.disabled = true;
  });
}

function renderResults(rows) {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  rows.forEach(row => {
    if (counts[row.choice] !== undefined) counts[row.choice] += 1;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  totalVotesEl.textContent = `${total} 票`;

  for (const key of ["A", "B", "C", "D"]) {
    const pct = total ? (counts[key] / total) * 100 : 0;
    document.getElementById(`bar-${key}`).style.width = `${pct}%`;
    document.getElementById(`value-${key}`).textContent =
      `${counts[key]} · ${pct.toFixed(0)}%`;
  }

  resultsEl.classList.remove("hidden");
}

async function loadResults() {
  if (!sb) return;
  const { data, error } = await sb
    .from("votes")
    .select("choice");

  if (error) {
    console.error(error);
    messageEl.textContent = "读取票数失败，请检查 Supabase 配置。";
    return;
  }
  renderResults(data || []);
}

async function findMyVote() {
  if (!sb) return null;

  const { data, error } = await sb
    .from("votes")
    .select("choice")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return data?.choice || null;
}

async function submitVote(choice) {
  if (!sb) {
    // 未配置 Supabase 时，只做本机演示。
    localStorage.setItem("euler_demo_vote", choice);
    setSelected(choice);
    messageEl.textContent = `你选择了 ${choice}。当前是演示模式，票数只保存在这台设备。`;
    renderResults([{ choice }]);
    return;
  }

  optionButtons.forEach(btn => btn.disabled = true);
  messageEl.textContent = "正在提交…";

  const existing = await findMyVote();
  if (existing) {
    setSelected(existing);
    messageEl.textContent = `你已经提交过：${existing}`;
    await loadResults();
    return;
  }

  const { error } = await sb
    .from("votes")
    .insert({
      choice,
      device_id: deviceId
    });

  if (error) {
    console.error(error);
    messageEl.textContent = "提交失败，请稍后再试。";
    optionButtons.forEach(btn => btn.disabled = false);
    return;
  }

  setSelected(choice);
  messageEl.textContent = `提交成功，你选择了 ${choice}`;
  await loadResults();
}

async function init() {
  optionButtons.forEach(btn => {
    btn.addEventListener("click", () => submitVote(btn.dataset.option));
  });

  if (!hasSupabaseConfig) {
    modeTextEl.textContent = "演示模式：配置 Supabase 后即可全班共享实时票数";
    const demoVote = localStorage.getItem("euler_demo_vote");
    if (demoVote) {
      setSelected(demoVote);
      messageEl.textContent = `这台设备已经选择过：${demoVote}`;
      renderResults([{ choice: demoVote }]);
    }
    return;
  }

  sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  modeTextEl.textContent = "实时投票已连接";

  const myVote = await findMyVote();
  if (myVote) {
    setSelected(myVote);
    messageEl.textContent = `你已经提交过：${myVote}`;
  }

  await loadResults();

  sb.channel("votes-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "votes" },
      async () => {
        await loadResults();
      }
    )
    .subscribe();
}

init();
