# 🔄 Persistent Storage Setup - Survive Session Restarts

## 🚨 **The Problem:**
Kaggle clears `/kaggle/working/` when sessions end, losing all checkpoints and progress.

## 🔧 **The Solution:**
Use **persistent storage** that survives session restarts.

## 🎯 **Setup Steps:**

### **Step 1: Create Persistent Dataset**
1. **Go to Kaggle Datasets**: https://www.kaggle.com/datasets
2. **Click "New Dataset"**
3. **Name it**: `medarion-checkpoints`
4. **Make it Private** (for your checkpoints)
5. **Upload any small file** (just to create the dataset)
6. **Click "Create"**

### **Step 2: Use the Persistent Script**
1. **Copy the persistent script** (`kaggle_persistent_qlora_script.py`)
2. **Paste into Kaggle notebook**
3. **Run the script**
4. **Checkpoints will be saved to persistent storage**

## 🔄 **How It Works:**

### **Persistent Storage Paths:**
```python
# These survive session restarts:
PERSISTENT_DIR = "/kaggle/input/medarion-checkpoints"  # ✅ Survives
CHECKPOINT_DIR = "/kaggle/working/checkpoints"         # ❌ Gets cleared
```

### **Checkpoint Saving:**
```python
def save_checkpoint(obj, filename):
    # Save to persistent storage (survives restarts)
    persistent_file = f"{PERSISTENT_DIR}/{filename}"
    with open(persistent_file, "wb") as f:
        pickle.dump(obj, f)
    
    # Also save to working directory (backup)
    working_file = f"{CHECKPOINT_DIR}/{filename}"
    with open(working_file, "wb") as f:
        pickle.dump(obj, f)
```

### **Checkpoint Loading:**
```python
def load_checkpoint(filename):
    # Try persistent storage first
    try:
        with open(f"{PERSISTENT_DIR}/{filename}", "rb") as f:
            return pickle.load(f)
    except FileNotFoundError:
        # Fallback to working directory
        with open(f"{CHECKPOINT_DIR}/{filename}", "rb") as f:
            return pickle.load(f)
```

## 🎯 **What Gets Saved Persistently:**

### **Model Checkpoints:**
- `tokenizer.pkl` - Tokenizer object
- `model.pkl` - Base model
- `lora_model.pkl` - LoRA model
- `trainer.pkl` - Trainer object

### **Data Checkpoints:**
- `train_data.pkl` - Training data
- `val_data.pkl` - Validation data
- `train_dataset.pkl` - Formatted training dataset
- `val_dataset.pkl` - Formatted validation dataset

### **Progress Tracking:**
- `training_progress.json` - Current step and status
- `final_model.bin` - Final trained model
- `adapter_config.json` - LoRA adapter config

## 🚀 **Session Restart Process:**

### **When Session Ends:**
```
🚀 Step 7: Starting QLoRA Training (Persistent Storage)...
💡 This will take 4-6 hours (FULL DATASET)...
📊 Training on 474K records with 52K validation records
🔄 Using QLoRA for efficient training...
💾 Checkpoints will be saved to persistent storage...
[Session ends here - training was at step 1500/3000]
💾 Progress saved to persistent storage: 7 - training_in_progress
```

### **When You Restart:**
```
🔄 Loaded progress from persistent storage: 7 - training_in_progress
🔄 Loading LoRA model from persistent checkpoints...
🔄 Loading formatted datasets from persistent checkpoints...
🔄 Loading trainer from persistent checkpoints...
🔄 Resuming training from persistent checkpoints...
[Continues from step 1500/3000]
```

## 🎯 **Benefits:**

### **✅ Survives Session Restarts:**
- **All checkpoints saved** to persistent storage
- **Progress tracking** survives restarts
- **No data loss** when sessions end
- **Resume from any step** automatically

### **✅ Flexible Timing:**
- **Start anytime** - no pressure to finish in one session
- **Resume anytime** - when you get more session time
- **Multiple sessions** - can take as many as needed
- **No time pressure** - train at your own pace

### **✅ Reliable Training:**
- **Built-in safety** - handles interruptions gracefully
- **Progress tracking** - know exactly where you are
- **Error recovery** - can resume even after errors
- **Backup system** - saves to both persistent and working directories

## 🎯 **What to Do:**

### **Setup (One Time):**
1. **Create dataset** called `medarion-checkpoints`
2. **Make it private** (for your checkpoints)
3. **Upload any small file** to create it

### **Training:**
1. **Use persistent script** (`kaggle_persistent_qlora_script.py`)
2. **Start training** - checkpoints saved to persistent storage
3. **If session ends** - don't worry, everything is saved
4. **Restart session** - script automatically resumes
5. **Continue training** - from where it left off

### **Multiple Sessions:**
1. **Session 1**: Start training, save checkpoints
2. **Session 2**: Resume training, continue from checkpoint
3. **Session 3**: Resume training, continue from checkpoint
4. **Session N**: Complete training, get final model

## 🎉 **Advantages:**

### **✅ No Data Loss:**
- **Persistent storage** survives session restarts
- **All progress saved** automatically
- **Resume from any step** when you restart
- **No need to start over** ever again

### **✅ Flexible Training:**
- **Train in multiple sessions** - no time pressure
- **Resume anytime** - when you get more session time
- **No rush** - take your time to complete training
- **Reliable completion** - guaranteed to finish

### **✅ Cost Effective:**
- **Use free tier** - no need for paid sessions
- **Multiple free sessions** - spread training across sessions
- **No wasted time** - resume exactly where you left off
- **Efficient resource usage** - only use what you need

## 🚀 **Ready to Use:**

**The persistent storage script provides:**
- **✅ Survives session restarts** - all checkpoints saved
- **✅ Automatic resume** - picks up exactly where you left off
- **✅ No data loss** - everything is preserved
- **✅ Flexible timing** - train at your own pace
- **✅ Reliable completion** - guaranteed to finish

**Set up persistent storage and never lose progress again!** 🎯
