document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    const APP_PIN = "1234"; 
    let editIndex = null;
    let db = JSON.parse(localStorage.getItem("tjm_final_pro") || "[]");
    let chartObj = null;

    // --- SISTEM LOGIN ---
    if (sessionStorage.getItem("isLoggedIn") === "true") {
        document.getElementById("login-screen").style.display = "none";
    }

    document.getElementById("btnLogin").onclick = () => {
        if (document.getElementById("pinInput").value === APP_PIN) {
            sessionStorage.setItem("isLoggedIn", "true");
            location.reload(); 
        } else {
            document.getElementById("loginError").style.display = "block";
            document.getElementById("pinInput").value = "";
        }
    };

    // --- DOM ELEMENTS ---
    const dom = {
        table: document.getElementById("tableBody"),
        monthSelect: document.getElementById("bulan"),
        priceList: document.getElementById("priceList"),
        btnSubmit: document.getElementById("btnSubmit"),
        inputs: {
            nama: document.getElementById("nama"),
            no: document.getElementById("noSambung"),
            alamat: document.getElementById("alamat"),
            wa: document.getElementById("wa")
        }
    };

    // --- UTILS ---
    const formatIDR = (v) => v.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const cleanNum = (v) => parseInt(v.replace(/\./g, "")) || 0;

    // --- INISIALISASI FORM ---
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    [2025, 2026].forEach(y => {
        const group = document.createElement("optgroup"); 
        group.label = y;
        months.forEach(m => {
            const opt = document.createElement("option"); 
            opt.value = `${m} ${y}`; 
            opt.innerText = `${m} ${y}`;
            group.appendChild(opt);
        });
        dom.monthSelect.appendChild(group);
    });

    dom.monthSelect.onchange = () => {
        dom.priceList.innerHTML = "";
        Array.from(dom.monthSelect.selectedOptions).forEach(opt => {
            const div = document.createElement("div");
            div.style = "display:flex; justify-content:space-between; align-items:center; padding:12px; background:#f2f2f7; border-radius:12px; margin-top:8px;";
            div.innerHTML = `<span>${opt.value}</span><input type="text" class="m-price" data-m="${opt.value}" placeholder="Rp 0" style="width:120px; text-align:right; border:none; background:transparent; font-weight:bold; outline:none;">`;
            dom.priceList.appendChild(div);
            div.querySelector('input').oninput = (e) => e.target.value = formatIDR(e.target.value);
        });
    };

    const resetForm = () => {
        Object.values(dom.inputs).forEach(input => input.value = "");
        dom.monthSelect.querySelectorAll('option').forEach(opt => opt.selected = false);
        dom.priceList.innerHTML = "";
        editIndex = null;
        dom.btnSubmit.innerText = "Simpan ke Database";
        dom.btnSubmit.style.background = "var(--blue)";
    };

    // --- RENDER ENGINE ---
    const render = () => {
        dom.table.innerHTML = "";
        const search = document.getElementById("globalSearch").value.toLowerCase();
        const filter = document.getElementById("filterAlamat").value;
        const hidePaid = document.getElementById("hideLunas").checked;
        let totalVal = 0;

        db.forEach((item, idx) => {
            if (hidePaid && item.lunas) return;
            if (search && !item.nama.toLowerCase().includes(search)) return;
            if (filter && item.alamat !== filter) return;
            
            totalVal += item.total;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><b>${item.nama}</b><br><small style="color:#8e8e93">${item.no}</small></td>
                <td>${item.alamat}</td>
                <td><small>${item.bulan.join(", ")}</small></td>
                <td><b>Rp ${item.total.toLocaleString('id-ID')}</b></td>
                <td><span class="badge ${item.lunas ? 'lunas' : 'belum'}">${item.lunas ? 'Lunas' : 'Belum'}</span></td>
                <td>
                    <div style="display:flex; gap:15px; color:var(--blue)">
                        <i data-lucide="edit-3" onclick="actions.edit(${idx})" style="cursor:pointer; color:#ff9500; width:18px"></i>
                        <i data-lucide="image" onclick="actions.share(${idx})" style="cursor:pointer; width:18px"></i>
                        <i data-lucide="check-circle" onclick="actions.pay(${idx})" style="cursor:pointer; width:18px"></i>
                        <i data-lucide="trash-2" onclick="actions.del(${idx})" style="cursor:pointer; color:#ff3b30; width:18px"></i>
                    </div>
                </td>`;
            dom.table.appendChild(tr);
        });
        
        lucide.createIcons();
        document.getElementById("statTotal").innerText = db.length;
        document.getElementById("statRupiah").innerText = "Rp " + totalVal.toLocaleString('id-ID');
        updateChart();
        updateRanking();
    };

    const updateRanking = () => {
        const list = document.getElementById("rankingList");
        list.innerHTML = "";
        db.filter(d => !d.lunas).sort((a,b) => b.total - a.total).slice(0, 5).forEach((d, i) => {
            const div = document.createElement("div");
            div.className = "ranking-item";
            div.innerHTML = `<div style="display:flex; align-items:center"><div style="width:28px; height:28px; background:#ff3b30; color:white; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; margin-right:12px; font-size:12px">${i+1}</div><div><b>${d.nama}</b><small style="display:block; color:#8e8e93">${d.bulan.length} Bulan</small></div></div><div style="color:#ff3b30; font-weight:bold;">Rp ${d.total.toLocaleString('id-ID')}</div>`;
            list.appendChild(div);
        });
    };

    // --- ACTIONS ---
    window.actions = {
        edit: (i) => {
            editIndex = i; 
            const data = db[i];
            dom.inputs.nama.value = data.nama; 
            dom.inputs.no.value = data.no;
            dom.inputs.alamat.value = data.alamat; 
            dom.inputs.wa.value = data.wa;
            Array.from(dom.monthSelect.options).forEach(opt => opt.selected = data.bulan.includes(opt.value));
            dom.monthSelect.onchange();
            setTimeout(() => {
                document.querySelectorAll(".m-price").forEach(inp => {
                    if(data.priceMap[inp.dataset.m]) inp.value = formatIDR(data.priceMap[inp.dataset.m].toString());
                });
            }, 50);
            dom.btnSubmit.innerText = "Perbarui Data";
            dom.btnSubmit.style.background = "#ff9500";
            window.scrollTo({top: 0, behavior: 'smooth'});
        },
        del: (i) => { if(confirm("Hapus?")) { db.splice(i,1); save(); } },
        pay: (i) => { db[i].lunas = !db[i].lunas; save(); },
        share: async (i) => {
            const d = db[i];
            const badge = document.getElementById("rec-status-badge");
            document.getElementById("rec-nama").innerText = d.nama.toUpperCase();
            document.getElementById("rec-no").innerText = d.no;
            document.getElementById("rec-alamat").innerText = d.alamat;
            document.getElementById("rec-bulan").innerText = d.bulan.join(", ");
            document.getElementById("rec-total").innerText = "Rp " + d.total.toLocaleString('id-ID');
            document.getElementById("rec-date").innerText = "Waktu Cetak: " + new Date().toLocaleString('id-ID');

            if (d.lunas) {
                badge.innerText = "✓ LUNAS TERBAYAR"; badge.style.background = "#e4f9eb"; badge.style.color = "#28a745";
            } else {
                badge.innerText = "⚠ MENUNGGU PEMBAYARAN"; badge.style.background = "#fff2f2"; badge.style.color = "#dc3545";
            }

            const canvas = await html2canvas(document.getElementById("receipt-content"), { scale: 3, backgroundColor: null });
            canvas.toBlob(blob => {
                const file = new File([blob], `Struk_${d.nama}.png`, { type: "image/png" });
                if (navigator.share) navigator.share({ files: [file] });
            }, "image/png");
        }
    };

    const save = () => { 
        localStorage.setItem("tjm_final_pro", JSON.stringify(db)); 
        render(); 
    };

    // --- CORE LOGIC ---
    dom.btnSubmit.onclick = () => {
        const pInp = document.querySelectorAll(".m-price");
        if(!dom.inputs.nama.value || pInp.length === 0) return alert("Lengkapi data!");
        
        let total = 0, priceMap = {}, bulanArr = [];
        pInp.forEach(inp => {
            const v = cleanNum(inp.value);
            priceMap[inp.dataset.m] = v; total += v; bulanArr.push(inp.dataset.m);
        });

        const newData = { 
            nama: dom.inputs.nama.value,
            no: dom.inputs.no.value,
            alamat: dom.inputs.alamat.value,
            wa: dom.inputs.wa.value,
            bulan: bulanArr, 
            priceMap, 
            total, 
            lunas: editIndex !== null ? db[editIndex].lunas : false 
        };

        if(editIndex !== null) { 
            db[editIndex] = newData; 
        } else { 
            db.push(newData); 
        }
        
        save();
        resetForm();
    };

    // --- EKSPOR PDF (KHUSUS LUNAS) ---
    document.getElementById("btnPrint").onclick = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        
        const dataLunas = db.filter(d => d.lunas === true);
        
        if (dataLunas.length === 0) {
            return alert("Tidak ada data lunas untuk dicetak!");
        }

        doc.setFontSize(16);
        doc.text("LAPORAN TAGIHAN - MAIDI SUJANA PRATAMA", 14, 15);
        
        const rows = dataLunas.map((d, i) => [
            i + 1, 
            d.nama, 
            d.no, 
            d.alamat, 
            d.bulan.join(", "), 
            `Rp ${d.total.toLocaleString('id-ID')}`, 
            "LUNAS"
        ]);

        doc.autoTable({ 
            head: [['No', 'Pelanggan', 'No Sambung', 'Alamat', 'Periode', 'Total', 'Status']], 
            body: rows, 
            startY: 25,
            headStyles: { fillColor: [52, 199, 89] } 
        });
        
        doc.save(`Laporan_Lunas_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const updateChart = () => {
        const dataMap = {};
        db.forEach(d => d.bulan.forEach(b => dataMap[b] = (dataMap[b] || 0) + (d.priceMap[b] || 0)));
        if(chartObj) chartObj.destroy();
        chartObj = new Chart(document.getElementById("mainChart"), {
            type: 'line',
            data: { labels: Object.keys(dataMap), datasets: [{ data: Object.values(dataMap), borderColor: '#007aff', tension: 0.4, fill: true, backgroundColor: 'rgba(0,122,255,0.1)' }] },
            options: { plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false } } } }
        });
    };

    // --- BACKUP & RESTORE ---
    document.getElementById("btnBackup").onclick = () => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(db)], {type:"application/json"}));
        a.download = `Backup_TJM.json`; a.click();
    };

    document.getElementById("btnRestore").onclick = () => document.getElementById("fileInput").click();
    document.getElementById("fileInput").onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => { db = JSON.parse(ev.target.result); save(); alert("Data Dimuat!"); };
        reader.readAsText(e.target.files[0]);
    };

    // --- LISTENERS ---
    document.getElementById("globalSearch").oninput = render;
    document.getElementById("hideLunas").onchange = render;
    document.getElementById("filterAlamat").onchange = render;
    render();
});
